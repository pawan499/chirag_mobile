import { AppPressable as Pressable } from './src/pressable';
import { PopupProvider, usePopup } from './src/popup';
import { ArrowLeft } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  login,
  logout,
  request,
  restoreSession,
  onSessionExpired,
  Session,
} from './src/api';
import {
  Button,
  Card,
  colors,
  ErrorBox,
  Field,
  Heading,
  Loading,
  NavIcon,
  MenuItem,
  styles,
  Title,
} from './src/ui';
import {
  Dashboard,
  FormScreen,
  OrderScreen,
  Page,
  PasswordScreen,
  PatientPicker,
  PatientScreen,
  PaymentScreen,
  ReceiptScreen,
  Records,
  Reports,
  Route,
} from './src/screens';
const rootTabs = [
  { name: 'dashboard', title: 'Home', icon: '⌂' },
  { name: 'patients', title: 'Patients', icon: '♙' },
  { name: 'spectacles', title: 'Orders', icon: '◎' },
  { name: 'payments', title: 'Payments', icon: '₹' },
  { name: 'more', title: 'More', icon: '☰' },
];
function Login({
  onLogin,
  notice,
}: {
  onLogin: (s: Session) => void;
  notice: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function submit() {
    if (lock.current) return;
    if (!email.trim() || password.length < 8) {
      setError('Enter your clinic email and password (at least 8 characters).');
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      onLogin(await login(email, password));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Page>
      <View style={{ paddingTop: 36, paddingBottom: 20, gap: 16 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 23,
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Image
            accessibilityLabel="Chirag eye and lamp logo"
            source={require('./assets/brand-icon.png')}
            style={{ width: 72, height: 72, borderRadius: 23 }}
          />
        </View>
        <Text
          style={{ color: colors.primary, fontWeight: '700', letterSpacing: 3 }}
        >
          CHIRAG EYE CARE & OPTICS
        </Text>
        <Title sub="Your clinic, wherever you are. Manage patients, prescriptions and payments in one place.">
          A clearer view of{'\n'}your day.
        </Title>
      </View>
      <Card>
        <Heading>Welcome back</Heading>
        <Field
          title="Email address"
          value={email}
          onChange={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
        />
        <Field
          title="Password"
          value={password}
          onChange={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
        />
        <ErrorBox message={error || notice} />
        <Button
          disabled={busy}
          title={busy ? 'Signing in…' : 'Sign in →'}
          onPress={() => void submit()}
        />
      </Card>
    </Page>
  );
}
function Workspace() {
  const showPopup = usePopup();
  const [session, setSession] = useState<Session | null>(null);
  const [starting, setStarting] = useState(true);
  const [notice, setNotice] = useState('');
  const [stack, setStack] = useState<Route[]>([{ name: 'dashboard' }]);
  const [revision, setRevision] = useState(0);
  const dirty = useRef(false);
  const route = stack[stack.length - 1];
  useEffect(() => {
    let live = true;
    onSessionExpired(() => {
      if (live) {
        setSession(null);
        setStack([{ name: 'dashboard' }]);
        dirty.current = false;
        setNotice('Your session expired. Please sign in again.');
      }
    });
    void (async () => {
      try {
        const stored = await restoreSession();
        if (stored) {
          await request('/auth/me');
          if (live) setSession(stored);
        }
      } catch (e) {
        if (live)
          setNotice(e instanceof Error ? e.message : 'Please sign in again.');
      } finally {
        if (live) setStarting(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);
  const navigate = useCallback((next: Route, replace = false) => {
    dirty.current = false;
    setStack(prev => (replace ? [next] : [...prev, next]));
    setRevision(n => n + 1);
  }, []);
  const leave = useCallback(
    (action: () => void) => {
      if (dirty.current)
        showPopup(
          'Discard unsaved changes?',
          'Your changes have not been saved.',
          [
            { text: 'Keep editing', style: 'cancel' },
            {
              text: 'Discard',
              style: 'destructive',
              onPress: () => {
                dirty.current = false;
                action();
              },
            },
          ],
        );
      else action();
    },
    [showPopup],
  );
  const back = useCallback(() => {
    if (stack.length < 2) return false;
    leave(() => {
      setStack(prev => prev.slice(0, -1));
      setRevision(n => n + 1);
    });
    return true;
  }, [stack.length, leave]);
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      back,
    );
    return () => subscription.remove();
  }, [back]);
  async function signOut() {
    try {
      await logout();
      setSession(null);
      setStack([{ name: 'dashboard' }]);
      setNotice('');
    } catch {
      showPopup('Unable to clear stored session', 'Please retry sign out.');
    }
  }
  const markDirty = () => {
    dirty.current = true;
  };
  let screen: React.ReactNode;
  if (starting) screen = <Loading />;
  else if (!session)
    screen = (
      <Login
        notice={notice}
        onLogin={s => {
          setSession(s);
          setNotice('');
        }}
      />
    );
  else {
    const props = { go: navigate };
    switch (route.name) {
      case 'dashboard':
        screen = <Dashboard {...props} user={session.user.name} />;
        break;
      case 'patients':
      case 'visits':
      case 'spectacles':
      case 'payments':
      case 'medicines':
        screen = (
          <Records {...props} kind={route.name} initialStatus={route.kind} />
        );
        break;
      case 'patient':
        screen = <PatientScreen {...props} id={route.id!} />;
        break;
      case 'select-patient':
        screen = <PatientPicker {...props} kind={route.kind!} />;
        break;
      case 'form':
        screen = (
          <FormScreen
            go={next => navigate(next, true)}
            route={route}
            dirty={markDirty}
          />
        );
        break;
      case 'payment':
        screen = (
          <PaymentScreen
            go={next => navigate(next, true)}
            id={route.id!}
            dirty={markDirty}
          />
        );
        break;
      case 'order':
        screen = <OrderScreen {...props} route={route} />;
        break;
      case 'receipt':
        screen = <ReceiptScreen route={route} />;
        break;
      case 'reports':
        screen = <Reports />;
        break;
      case 'password':
        screen = (
          <PasswordScreen onSaved={() => navigate({ name: 'more' }, true)} />
        );
        break;
      default:
        screen = (
          <Page>
            <Title sub={`${session.user.name} · ${session.user.email}`}>
              Your workspace
            </Title>
            <Card>
              {[
                { title: 'Visits & prescriptions', name: 'visits' },
                { title: 'Medicine catalogue', name: 'medicines' },
                { title: 'Collection reports', name: 'reports' },
                { title: 'Clinic settings', name: 'form', kind: 'settings' },
                { title: 'Change password', name: 'password' },
              ].map(item => (
                <MenuItem
                  key={item.title}
                  name={item.name}
                  title={item.title}
                  onPress={() => navigate(item)}
                />
              ))}
            </Card>
            <Card>
              <Heading>Connected clinic</Heading>
              <Text selectable style={styles.muted}>
                {session.baseUrl}
              </Text>
            </Card>
            <Button
              danger
              title="Sign out"
              onPress={() =>
                showPopup(
                  'Sign out?',
                  'You can sign back in with your clinic account.',
                  [
                    { text: 'Stay', style: 'cancel' },
                    { text: 'Sign out', onPress: () => void signOut() },
                  ],
                )
              }
            />
          </Page>
        );
    }
  }
  return (
    <SafeAreaView
      style={styles.page}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      {session && (
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderColor: colors.line,
          }}
        >
          {stack.length > 1 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={12}
              onPress={back}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                minHeight: 44,
              }}
            >
              <ArrowLeft size={21} color={colors.primary} />
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 16,
                  fontWeight: '700',
                }}
              >
                Back
              </Text>
            </Pressable>
          ) : (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Image
                source={require('./assets/brand-icon.png')}
                accessibilityLabel="Chirag logo"
                style={{ width: 32, height: 32 }}
              />
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 17,
                  fontWeight: '800',
                }}
              >
                Chirag
              </Text>
            </View>
          )}
          <Text
            style={[
              styles.muted,
              { flexShrink: 1, textAlign: 'right', marginLeft: 12 },
            ]}
          >
            EYE CARE & OPTICS
          </Text>
        </View>
      )}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View key={`${session ? 'in' : 'out'}-${revision}`} style={{ flex: 1 }}>
          {screen}
        </View>
      </KeyboardAvoidingView>
      {session && (
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 24,
            marginHorizontal: 12,
            marginBottom: 8,
            paddingHorizontal: 4,
            paddingVertical: 8,
            elevation: 6,
            shadowColor: colors.ink,
            shadowOpacity: 0.06,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          {rootTabs.map(tab => {
            const active = route.name === tab.name;
            return (
              <Pressable
                key={tab.name}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={tab.title}
                onPress={() => leave(() => navigate({ name: tab.name }, true))}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 5,
                  gap: 2,
                }}
              >
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 14,
                    backgroundColor: active ? colors.pale : 'transparent',
                  }}
                >
                  <NavIcon
                    name={tab.name}
                    color={active ? colors.primary : colors.muted}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    textAlign: 'center',
                    alignSelf: 'stretch',
                    fontWeight: active ? '800' : '500',
                    color: active ? colors.primary : colors.muted,
                  }}
                >
                  {tab.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <PopupProvider>
        <Workspace />
      </PopupProvider>
    </SafeAreaProvider>
  );
}
