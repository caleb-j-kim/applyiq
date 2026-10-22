package com.applyiq.users;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    // Two-factor authentication (auth.TwoFactorService). The secret is encrypted with
    // common.TokenCipher and is set as soon as setup starts; totpEnabled only flips once the user
    // proves their app works by entering a code. The column default lets ddl-auto add it to
    // existing rows.
    @Column(name = "totp_secret_enc", columnDefinition = "TEXT")
    private String totpSecretEnc;

    @Column(name = "totp_enabled", nullable = false, columnDefinition = "boolean default false")
    private boolean totpEnabled;

    // Last 30-second step a code was accepted for, so the same code can't be used twice.
    @Column(name = "totp_last_step")
    private Long totpLastStep;

    // SHA-256 hashes of the unused one-time recovery codes, comma-separated.
    @Column(name = "totp_recovery_hashes", columnDefinition = "TEXT")
    private String totpRecoveryHashes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
