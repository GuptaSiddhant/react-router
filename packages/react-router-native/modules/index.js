import React from 'react';
import { Alert, BackHandler, Linking, TouchableHighlight } from 'react-native';
import {
  MemoryRouter,
  useBlocker,
  useLocation,
  useNavigate
} from 'react-router';
import PropTypes from 'prop-types';

////////////////////////////////////////////////////////////////////////////////
// RE-EXPORTS
////////////////////////////////////////////////////////////////////////////////

// Note: Keep in sync with react-router exports!
export {
  // components
  MemoryRouter,
  Navigate,
  Outlet,
  Redirect,
  Route,
  Router,
  Routes,
  // hooks
  useBlocker,
  useHref,
  useLocation,
  useMatch,
  useNavigate,
  useOutlet,
  useParams,
  useResolvedLocation,
  useRoutes,
  // utils
  createRoutesFromChildren,
  matchRoutes,
  resolveLocation,
  generatePath
} from 'react-router';

////////////////////////////////////////////////////////////////////////////////
// COMPONENTS
////////////////////////////////////////////////////////////////////////////////

/**
 * A <Router> that runs on React Native.
 */
export function NativeRouter(props) {
  return <MemoryRouter {...props} />;
}

if (__DEV__) {
  NativeRouter.displayName = 'NativeRouter';
  NativeRouter.propTypes = MemoryRouter.propTypes;
}

/**
 * A <TouchableHighlight> that navigates to a different URL when touched.
 */
export function Link({
  as: Component = TouchableHighlight,
  onPress,
  replace = false,
  state,
  to,
  ...rest
}) {
  let navigate = useNavigate();

  return (
    <Component
      {...rest}
      onPress={event => {
        if (onPress) onPress(event);
        if (!event.defaultPrevented) {
          navigate(to, { replace, state });
        }
      }}
    />
  );
}

if (__DEV__) {
  Link.displayName = 'Link';
  Link.propTypes = {
    as: PropTypes.elementType,
    onPress: PropTypes.func,
    replace: PropTypes.bool,
    state: PropTypes.object,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
  };
}

/**
 * A declarative interface for showing an Alert dialog with the given
 * message when the user tries to navigate away from the current screen.
 *
 * This also serves as a reference implementation for anyone who wants
 * to create their own custom prompt component.
 */
export function Prompt({ message, when = false }) {
  usePrompt(message, when);
  return null;
}

if (__DEV__) {
  Prompt.displayName = 'Prompt';
  Prompt.propTypes = {
    message: PropTypes.string,
    when: PropTypes.bool
  };
}

////////////////////////////////////////////////////////////////////////////////
// HOOKS
////////////////////////////////////////////////////////////////////////////////

const HardwareBackPressEventType = 'hardwareBackPress';

/**
 *
 */
export function useHardwareBackButton() {
  let location = useLocation();
  let navigate = useNavigate();

  React.useEffect(() => {
    function handleHardwardBackPress() {
      if (location.index === 0) {
        // do nothing, we're already on the home screen
      } else {
        navigate(-1);
      }

      // TODO
      // if (this.history.index === 0) {
      //   return false; // home screen
      // } else {
      //   this.history.goBack();
      //   return true;
      // }
    }

    BackHandler.addEventListener(
      HardwareBackPressEventType,
      handleHardwardBackPress
    );

    return () => {
      BackHandler.removeEventListener(
        HardwareBackPressEventType,
        handleHardwardBackPress
      );
    };
  }, [location.index, navigate]);
}

export { useHardwareBackButton as useAndroidBackButton };

const URLEventType = 'url';

export function useDeepLinking() {
  let navigate = useNavigate();

  // Get the initial URL
  let firstRender = React.useRef(true);
  if (firstRender.current) {
    firstRender.current = false;
    Linking.getInitialURL().then(url => {
      if (url) navigate(trimScheme(url));
    });
  }

  // Listen for URL changes
  React.useEffect(() => {
    function handleURLChange(event) {
      navigate(trimScheme(event.url));
    }

    Linking.addEventListener(URLEventType, handleURLChange);

    return () => {
      Linking.removeEventListener(URLEventType, handleURLChange);
    };
  }, [navigate]);
}

function trimScheme(url) {
  return url.replace(/^.*?:\/\//, '');
}

/**
 * Prompts the user with an Alert before they leave the current screen.
 */
export function usePrompt({ message, when = true }) {
  let blocker = React.useCallback(
    tx => {
      Alert.alert('Confirm', message, [
        { text: 'Cancel', onPress() {} },
        {
          text: 'OK',
          onPress() {
            tx.retry();
          }
        }
      ]);
    },
    [message]
  );

  useBlocker(blocker, when);
}
