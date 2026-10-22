package com.applyiq.followups;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * Runtime half of the follow-up decision tree. The trees are trained in Python
 * (ml/follow_up_model/train.py) and exported as sklearn's flat node arrays; this
 * class only walks them, so the API never needs a Python process. Retrain and
 * re-export to change behavior — nothing here encodes the rules.
 */
@Component
public class FollowUpModel {

    static final String RESOURCE = "ml/follow-up-tree.json";

    /** One split taken on the way to a leaf: feature index, threshold, and whether x was <= threshold. */
    public record Split(int feature, double threshold, boolean atOrBelow) {
    }

    public record Prediction(String action, double confidence, double ghostingRisk, List<Split> path) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ModelFile(List<String> features, List<String> actions, Tree classifier, Tree regressor) {
    }

    record Tree(int[] feature, double[] threshold, int[] left, int[] right, double[][] value) {
        int leaf(double[] x, List<Split> path) {
            int node = 0;
            while (left[node] != -1) {
                boolean atOrBelow = x[feature[node]] <= threshold[node];
                if (path != null) path.add(new Split(feature[node], threshold[node], atOrBelow));
                node = atOrBelow ? left[node] : right[node];
            }
            return node;
        }
    }

    private final ModelFile model;

    public FollowUpModel() throws IOException {
        try (InputStream in = new ClassPathResource(RESOURCE).getInputStream()) {
            model = new ObjectMapper().readValue(in, ModelFile.class);
        }
    }

    public List<String> features() {
        return model.features();
    }

    public Prediction predict(double[] x) {
        if (x.length != model.features().size()) {
            throw new IllegalArgumentException("Expected " + model.features().size() + " features, got " + x.length);
        }
        List<Split> path = new ArrayList<>();
        double[] classProbs = model.classifier().value()[model.classifier().leaf(x, path)];
        int best = 0;
        for (int i = 1; i < classProbs.length; i++) {
            if (classProbs[i] > classProbs[best]) best = i;
        }
        double risk = model.regressor().value()[model.regressor().leaf(x, null)][0];
        return new Prediction(model.actions().get(best), classProbs[best], risk, path);
    }
}
