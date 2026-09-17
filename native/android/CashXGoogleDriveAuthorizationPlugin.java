package com.cashx.app;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.IntentSender;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.identity.AuthorizationClient;
import com.google.android.gms.auth.api.identity.AuthorizationRequest;
import com.google.android.gms.auth.api.identity.AuthorizationResult;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.Scopes;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.Scope;

import java.util.Collections;

@CapacitorPlugin(
    name = "CashXGoogleDriveAuthorization",
    requestCodes = { CashXGoogleDriveAuthorizationPlugin.REQUEST_AUTHORIZE }
)
public final class CashXGoogleDriveAuthorizationPlugin extends Plugin {
    static final int REQUEST_AUTHORIZE = 19401;

    private PluginCall pendingCall;
    private boolean authorizationInFlight;

    @PluginMethod
    public void getAccessToken(PluginCall call) {
        if (authorizationInFlight) {
            call.reject("Google Drive authorization is already in progress.", "AUTHORIZATION_IN_PROGRESS");
            return;
        }

        authorizationInFlight = true;

        AuthorizationRequest request = AuthorizationRequest.builder()
            .setRequestedScopes(Collections.singletonList(new Scope(Scopes.DRIVE_APPFOLDER)))
            .setOptOutIncludingGrantedScopes(true)
            .build();

        Identity.getAuthorizationClient(getActivity())
            .authorize(request)
            .addOnSuccessListener(result -> handleInitialResult(call, result))
            .addOnFailureListener(error -> {
                authorizationInFlight = false;
                call.reject("Google Drive authorization failed.", "AUTHORIZATION_FAILED", error);
            });
    }

    private void handleInitialResult(PluginCall call, AuthorizationResult result) {
        if (!result.hasResolution()) {
            authorizationInFlight = false;
            resolveAccessToken(call, result);
            return;
        }

        PendingIntent pendingIntent = result.getPendingIntent();
        if (pendingIntent == null) {
            authorizationInFlight = false;
            call.reject("Google Drive authorization did not provide a consent flow.", "AUTHORIZATION_UNAVAILABLE");
            return;
        }

        pendingCall = call;
        try {
            getActivity().startIntentSenderForResult(
                pendingIntent.getIntentSender(),
                REQUEST_AUTHORIZE,
                null,
                0,
                0,
                0,
                null
            );
        } catch (IntentSender.SendIntentException error) {
            pendingCall = null;
            authorizationInFlight = false;
            call.reject("Google Drive authorization could not open the consent flow.", "AUTHORIZATION_UNAVAILABLE", error);
        }
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);

        if (requestCode != REQUEST_AUTHORIZE) {
            return;
        }

        PluginCall call = pendingCall;
        pendingCall = null;
        authorizationInFlight = false;

        if (call == null) {
            return;
        }

        if (resultCode != Activity.RESULT_OK || data == null) {
            call.reject("Google Drive authorization was cancelled.", "AUTHORIZATION_CANCELLED");
            return;
        }

        try {
            AuthorizationClient client = Identity.getAuthorizationClient(getActivity());
            AuthorizationResult result = client.getAuthorizationResultFromIntent(data);
            resolveAccessToken(call, result);
        } catch (ApiException error) {
            call.reject("Google Drive authorization failed.", "AUTHORIZATION_FAILED", error);
        }
    }

    private void resolveAccessToken(PluginCall call, AuthorizationResult result) {
        if (!result.getGrantedScopes().contains(Scopes.DRIVE_APPFOLDER)) {
            call.reject("Google Drive app data permission was not granted.", "AUTHORIZATION_SCOPE_NOT_GRANTED");
            return;
        }

        String token = result.getAccessToken();
        if (token == null || token.trim().isEmpty()) {
            call.reject("Google Drive authorization returned no access token.", "AUTHORIZATION_EMPTY_TOKEN");
            return;
        }

        JSObject response = new JSObject();
        response.put("accessToken", token);
        call.resolve(response);
    }

    @Override
    protected void handleOnDestroy() {
        if (pendingCall != null) {
            pendingCall.reject("Google Drive authorization was interrupted.", "AUTHORIZATION_INTERRUPTED");
            pendingCall = null;
        }
        authorizationInFlight = false;
        super.handleOnDestroy();
    }
}
