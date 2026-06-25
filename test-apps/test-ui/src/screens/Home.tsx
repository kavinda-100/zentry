import {
  Authenticated,
  LoginButton,
  LogoutButton,
  RegisterButton,
  UnAuthenticated,
  useZentry,
} from '@zentry-org/sdk/react';

const Home = () => {
  const { session, isLoading, isAuthenticated } = useZentry();
  return (
    <main
      style={{
        padding: '1rem',
        textAlign: 'center',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        gap: '1rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {isLoading && <p>Loading...</p>}
      {isAuthenticated && <p>Authenticated</p>}
      {session && (
        <div>
          <p>session data</p>
          <br />
          <h1>user</h1>
          <ol>
            <li>id: {session.user.id}</li>
            <li>firstName: {session.user.firstName}</li>
            <li>lastName: {session.user.lastName}</li>
            <li>email: {session.user.email}</li>
          </ol>
          <br />
          <h1>organization data</h1>
          <ol>
            <li>id: {session.org.id}</li>
            <li>name: {session.org.name}</li>
          </ol>
          <br />
          <h1>membership data</h1>
          <ol>
            <li>id: {session.membership.id}</li>
            <li>role: {session.membership.role}</li>
            <li>isBand: {session.membership.isBanned}</li>
            <li>permissions: {JSON.stringify(session.membership.permissions, null, 2)}</li>
          </ol>
        </div>
      )}

      <br />
      <br />

      <UnAuthenticated>
        <RegisterButton className="btn btn-secondary" />
        <LoginButton className="btn btn-primary" />
      </UnAuthenticated>

      <Authenticated>
        <LogoutButton className="btn btn-danger" label="Sign out" />
      </Authenticated>
    </main>
  );
};
export default Home;
