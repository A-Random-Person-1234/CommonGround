(() => {
  "use strict";

  const statusNode = document.querySelector("#oauthPopupStatus");
  const closeButton = document.querySelector("#oauthPopupClose");
  const params = new URLSearchParams(window.location.hash.slice(1));
  const provider = params.get("provider");
  const status = params.get("status");
  const requestId = params.get("requestId");
  const error = params.get("errorCode");
  const allowedErrors = new Set([
    "access_denied",
    "provider_error",
    "calendar_connection_failed"
  ]);
  const validRequestId = typeof requestId === "string" && /^[A-Za-z0-9_-]{32,128}$/.test(requestId);
  const validStatus = status === "success" || status === "error";
  const validError = status !== "error" || allowedErrors.has(error);

  window.history.replaceState(null, "", window.location.pathname);

  const showCloseButton = () => {
    closeButton.hidden = false;
    closeButton.focus();
  };

  closeButton.addEventListener("click", () => window.close());

  if (provider !== "google" || !validStatus || !validRequestId || !validError) {
    statusNode.textContent = "This Google connection result could not be verified. Close this window and try again.";
    showCloseButton();
    return;
  }

  const payload = {
    type: "commonground:google-oauth",
    provider: "google",
    status,
    requestId
  };
  if (status === "error") payload.errorCode = error;

  if (!window.opener || window.opener.closed) {
    statusNode.textContent = status === "success"
      ? "Google Calendar is connected. You can close this window."
      : "Google Calendar could not be connected. Close this window and try again.";
    showCloseButton();
    return;
  }

  try {
    window.opener.postMessage(payload, window.location.origin);
    statusNode.textContent = status === "success"
      ? "Google Calendar is connected. Returning to CommonGround..."
      : "Returning to CommonGround...";
    window.setTimeout(() => {
      window.close();
      window.setTimeout(showCloseButton, 250);
    }, 120);
  } catch {
    statusNode.textContent = "CommonGround could not receive the connection result. Close this window and try again.";
    showCloseButton();
  }
})();
