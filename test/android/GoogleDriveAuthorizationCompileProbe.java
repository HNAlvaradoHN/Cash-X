package com.cashx.app;

import android.app.Activity;

import com.google.android.gms.auth.api.identity.AuthorizationClient;
import com.google.android.gms.auth.api.identity.AuthorizationRequest;
import com.google.android.gms.auth.api.identity.AuthorizationResult;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.Scopes;
import com.google.android.gms.common.api.Scope;
import com.google.android.gms.tasks.Task;

import java.util.Collections;

/**
 * Compile-only checkpoint probe. This class is copied into the generated Android
 * project in CI and is never shipped in the normal Cash-X APK artifact.
 */
public final class GoogleDriveAuthorizationCompileProbe {
    private GoogleDriveAuthorizationCompileProbe() {}

    public static Task<AuthorizationResult> requestAppDataAccess(Activity activity) {
        AuthorizationRequest request = AuthorizationRequest.builder()
            .setRequestedScopes(Collections.singletonList(new Scope(Scopes.DRIVE_APPFOLDER)))
            .build();

        AuthorizationClient client = Identity.getAuthorizationClient(activity);
        return client.authorize(request);
    }
}
