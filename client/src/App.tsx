import { useContext, useEffect, useMemo, useState } from "react";
import { Route, Routes, useNavigate, useSearchParams } from "react-router-dom";

// pages
import { Error, InfoPage, LeaderboardHome, ResetPage } from "./pages";

// context
import { GlobalDispatchContext } from "./context/GlobalContext";
import { InteractiveParams, SET_HAS_SETUP_BACKEND, SET_INTERACTIVE_PARAMS } from "./context/types";

// utils
import { setupBackendAPI } from "./utils/backendAPI";

const App = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hasInitBackendAPI, setHasInitBackendAPI] = useState(false);
  const [hasMissingParams, setHasMissingParams] = useState(false);

  const dispatch = useContext(GlobalDispatchContext);

  const interactiveParams: InteractiveParams = useMemo(
    () => ({
      assetId: searchParams.get("assetId") || "",
      displayName: searchParams.get("displayName") || "",
      identityId: searchParams.get("identityId") || "",
      interactiveNonce: searchParams.get("interactiveNonce") || "",
      interactivePublicKey: searchParams.get("interactivePublicKey") || "",
      profileId: searchParams.get("profileId") || "",
      sceneDropId: searchParams.get("sceneDropId") || "",
      uniqueName: searchParams.get("uniqueName") || "",
      urlSlug: searchParams.get("urlSlug") || "",
      username: searchParams.get("username") || "",
      visitorId: searchParams.get("visitorId") || "",
    }),
    [searchParams],
  );

  useEffect(() => {
    if (interactiveParams.assetId) {
      dispatch!({ type: SET_INTERACTIVE_PARAMS, payload: { interactiveParams } });
    }
  }, [interactiveParams, dispatch]);

  useEffect(() => {
    if (!interactiveParams.assetId) {
      setHasMissingParams(true);
      return;
    }
    if (hasInitBackendAPI) return;
    setupBackendAPI(interactiveParams)
      .then(() => {
        dispatch!({ type: SET_HAS_SETUP_BACKEND, payload: {} });
      })
      .catch((error) => {
        console.error(error?.response?.data?.message);
        navigate("*");
      })
      .finally(() => setHasInitBackendAPI(true));
  }, [hasInitBackendAPI, interactiveParams, dispatch, navigate]);

  if (hasMissingParams) {
    return (
      <div className="flex flex-col gap-4 text-center justify-center h-screen">
        <h2>Missing Interactive Parameters</h2>
        <p>Required interactive parameters are missing. Please access this app from inside a Topia world.</p>
        <p className="p2">
          To load correctly, the app must be added as an interactive asset with the correct Developer Public Key and
          "Add player session credentials to asset interactions" toggled on. See our{" "}
          <a className="text-success" href="https://metaversecloud-com.github.io/mc-sdk-js/index.html">
            SDK docs
          </a>{" "}
          for details.
        </p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LeaderboardHome />} />
      <Route path="/leaderboard" element={<LeaderboardHome />} />
      <Route path="/info" element={<InfoPage />} />
      <Route path="/reset" element={<ResetPage />} />
      <Route path="*" element={<Error />} />
    </Routes>
  );
};

export default App;
