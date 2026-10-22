package com.applyiq.email;

import com.applyiq.users.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * A user's linked inbox. Tokens are stored AES-GCM encrypted (see {@link TokenCipher}) —
 * a refresh token is long-lived read access to someone's mail, so it never sits in plain text.
 */
@Entity
@Table(name = "email_connections", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "provider"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailConnection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Eager (the ManyToOne default): the scheduled sync runs outside any request/session.
    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(16)")
    private EmailProvider provider;

    @Column(name = "email_address")
    private String emailAddress;

    @Column(name = "refresh_token_enc", nullable = false, columnDefinition = "TEXT")
    private String refreshTokenEnc;

    @Column(name = "access_token_enc", columnDefinition = "TEXT")
    private String accessTokenEnc;

    @Column(name = "access_token_expires_at")
    private Instant accessTokenExpiresAt;

    @Column(name = "last_synced_at", nullable = false)
    private Instant lastSyncedAt;

    @Column(name = "auto_update_status", nullable = false)
    private boolean autoUpdateStatus;

    @Column(name = "auto_add_applications", nullable = false)
    private boolean autoAddApplications;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
