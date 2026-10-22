package com.applyiq.followups;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * "Mark as done" on a model recommendation. Keyed on the action, so the application comes back
 * when the model recommends something different (e.g. first follow-up -> final follow-up).
 * Plain UUID columns, no FKs, so deleting an application never trips over these rows.
 */
@Entity
@Table(name = "follow_up_dismissals",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "job_application_id", "recommended_action"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FollowUpDismissal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "job_application_id", nullable = false)
    private UUID jobApplicationId;

    @Column(name = "recommended_action", nullable = false, columnDefinition = "varchar(64)")
    private String recommendedAction;
}
