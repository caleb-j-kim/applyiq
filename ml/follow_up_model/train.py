"""Train ApplyIQ's follow-up decision tree and export it for the Java backend.

There's no labeled history of real outcomes yet, so training data is synthetic:
applications are sampled across realistic ranges and labeled by recruiting
rules of thumb (follow up after ~10 quiet days, sooner with a referral or after
an interview, give up after two unanswered follow-ups), with label noise so the
tree learns thresholds instead of memorising the rules.

Two trees are exported to one JSON file:
  - classifier: the recommended action
  - regressor:  ghosting risk, 0..1

The backend (com.applyiq.followups.FollowUpModel) walks the exported arrays, so
Python is only needed to retrain, never at runtime.

Usage:  python ml/follow_up_model/train.py
"""

import json
from pathlib import Path

import numpy as np
from sklearn.metrics import accuracy_score, mean_absolute_error
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor

OUT = Path(__file__).resolve().parents[2] / "backend/src/main/resources/ml/follow-up-tree.json"

# Order matters: the Java side builds its feature vector in exactly this order.
FEATURES = [
    "status_applied",
    "status_online_assessment",
    "status_interviewing",
    "status_final_round",
    "status_ghosted",
    "status_rejected",
    "status_withdrawn",
    "days_since_applied",
    "days_since_contact",
    "follow_up_count",
    "has_referral",
    "priority",  # 0 low, 1 medium, 2 high
    "interview_rounds_completed",
]
STATUSES = ["applied", "online_assessment", "interviewing", "final_round", "ghosted", "rejected", "withdrawn"]
STATUS_WEIGHTS = [0.40, 0.10, 0.15, 0.07, 0.10, 0.10, 0.08]

ACTIONS = [
    "Send first follow-up",
    "Send final follow-up",
    "Wait longer",
    "Mark as likely ghosted",
    "Move to rejected",
    "Archive application",
]


def quiet_threshold(status, has_referral, priority):
    """Days of silence before a follow-up is worth sending."""
    base = 7 if status in ("interviewing", "final_round") else 10
    return base - 2 * has_referral - (priority == 2)


def label_action(status, contact, follow_ups, has_referral, priority):
    if status in ("rejected", "withdrawn"):
        return "Archive application"
    if status == "ghosted":
        return "Send final follow-up" if follow_ups < 2 and contact < 45 else "Archive application"

    t = quiet_threshold(status, has_referral, priority)
    if contact < t:
        return "Wait longer"
    if contact >= 75:
        return "Move to rejected"
    if follow_ups == 0:
        return "Send first follow-up"
    if follow_ups == 1:
        return "Send final follow-up" if contact >= t + 7 else "Wait longer"
    return "Mark as likely ghosted" if contact >= t + 14 else "Wait longer"


def ghosting_risk(status, contact, follow_ups, has_referral, rounds):
    if status in ("rejected", "withdrawn"):
        return 0.05
    if status == "ghosted":
        return 0.9
    t = quiet_threshold(status, has_referral, 1)
    z = (contact - t) / 8 + 0.6 * follow_ups - 0.8 * has_referral - 0.5 * min(rounds, 3)
    return 1 / (1 + np.exp(-(z - 1)))


def make_dataset(n, rng):
    rows, actions, risks = [], [], []
    for _ in range(n):
        status = rng.choice(STATUSES, p=STATUS_WEIGHTS)
        applied = int(rng.integers(0, 120))
        contact = int(rng.integers(0, applied + 1)) if rng.random() < 0.4 else applied
        follow_ups = int(rng.choice([0, 1, 2, 3], p=[0.5, 0.3, 0.15, 0.05]))
        has_referral = int(rng.random() < 0.3)
        priority = int(rng.integers(0, 3))
        rounds = int(rng.integers(1, 5)) if status in ("interviewing", "final_round") else 0

        action = label_action(status, contact, follow_ups, has_referral, priority)
        if rng.random() < 0.05:  # label noise
            action = rng.choice(ACTIONS)
        risk = float(np.clip(ghosting_risk(status, contact, follow_ups, has_referral, rounds) + rng.normal(0, 0.05), 0, 1))

        rows.append([int(status == s) for s in STATUSES] + [applied, contact, follow_ups, has_referral, priority, rounds])
        actions.append(ACTIONS.index(action))
        risks.append(risk)
    return np.array(rows), np.array(actions), np.array(risks)


def export_tree(model):
    t = model.tree_
    values = t.value[:, 0, :]
    return {
        "feature": t.feature.tolist(),  # -2 at leaves
        "threshold": [round(float(x), 4) for x in t.threshold],
        "left": t.children_left.tolist(),  # -1 at leaves; go left when x <= threshold
        "right": t.children_right.tolist(),
        "value": [[round(float(v), 4) for v in row] for row in values],
    }


def main():
    rng = np.random.default_rng(42)
    X, y, risk = make_dataset(50000, rng)
    X_tr, X_te, y_tr, y_te, r_tr, r_te = train_test_split(X, y, risk, test_size=0.2, random_state=42)

    clf = DecisionTreeClassifier(max_depth=10, min_samples_leaf=15, random_state=42).fit(X_tr, y_tr)
    reg = DecisionTreeRegressor(max_depth=7, min_samples_leaf=25, random_state=42).fit(X_tr, r_tr)

    acc = accuracy_score(y_te, clf.predict(X_te))
    mae = mean_absolute_error(r_te, reg.predict(X_te))
    print(f"action accuracy {acc:.3f} (noise ceiling ~0.96), risk MAE {mae:.3f}")
    print(f"classifier: {clf.get_n_leaves()} leaves, depth {clf.get_depth()}; regressor: {reg.get_n_leaves()} leaves")

    # Self-check: the scenarios the follow-ups page's mock data shows must come out as labeled there.
    def predict(status, applied, contact, follow_ups, referral=0, priority=1, rounds=0):
        row = [[int(status == s) for s in STATUSES] + [applied, contact, follow_ups, referral, priority, rounds]]
        return ACTIONS[clf.predict(row)[0]]

    assert acc > 0.9, acc
    assert predict("applied", 3, 3, 0) == "Wait longer"
    assert predict("applied", 14, 14, 0) == "Send first follow-up"
    assert predict("applied", 25, 25, 0) == "Send first follow-up"
    assert predict("final_round", 42, 15, 1, rounds=3) == "Send final follow-up"
    assert predict("applied", 61, 51, 2) == "Mark as likely ghosted"
    assert predict("withdrawn", 84, 84, 0) == "Archive application"
    assert predict("applied", 90, 90, 1) == "Move to rejected"

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "features": FEATURES,
        "actions": ACTIONS,
        "metrics": {"actionAccuracy": round(acc, 4), "riskMae": round(mae, 4)},
        "classifier": export_tree(clf),
        "regressor": export_tree(reg),
    }))
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
