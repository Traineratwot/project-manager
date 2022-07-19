import { createRoot }                    from 'react-dom/client';
import PrimeReact, { addLocale, locale } from 'primereact/api';
import App                               from './App';
import i18n                              from './classes/i18n';
import Notifications                     from './classes/Notifications';
import ucfirst                           from '../utills/ucfirst';
import './styles/firaCode.scss';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'primeicons/primeicons.css';
import 'primereact/resources/themes/bootstrap4-dark-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import './styles/reset.scss';
import LanguagesExtensions               from '../../assets/Programming_Languages_Extensions.json';
import languagesColors                   from '../../assets/Programming_Languages_colors.json';
import AppTray                           from './AppTray';

PrimeReact.ripple     = true;
PrimeReact.inputStyle = 'filled';
addLocale('ru', {});
addLocale('en', {});
locale(window.electron.settings.get('locale'));
// eslint-disable-next-line no-extend-native,func-names
String.prototype.ucfirst   = function() {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return ucfirst(this);
};
window.i18n                = i18n;
window.Notifications       = Notifications;
window.LanguagesExtensions = LanguagesExtensions;
window.languagesColors     = languagesColors;
window.ImageCache          = {};
window.pixel               = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const container            = document.getElementById('root')!;
const root                 = createRoot(container);
const TrayWindowWidth      = window.electron.store.get('engine.TrayWindowWidth');
if (window.innerWidth <= TrayWindowWidth + 5) {
	root.render(<AppTray />);
} else {
	root.render(<App />);
}
