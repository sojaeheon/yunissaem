import RootNavigator from './src/navigation/RootNavigator';
import Toast from 'react-native-toast-message';

export default function App() {
  return (
    <>
      <RootNavigator />
      <Toast position="bottom" />
    </>
  );
}