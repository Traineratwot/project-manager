import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example' | 'electron-progressbar-update' | 'test';

export const bridge = {
	ipcRenderer: {
		sendMessage(channel: Channels, args: unknown[]) {
			ipcRenderer.send(channel, args);
		},
		on(channel: Channels, func: (...args: any[]) => void) {
			const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
				func(...args);
			ipcRenderer.on(channel, subscription);

			return () => ipcRenderer.removeListener(channel, subscription);
		},
		once(channel: Channels, func: (...args: unknown[]) => void) {
			ipcRenderer.once(channel, (_event, ...args) => func(...args));
		}
	},
	store      : {
		get(property: string) {
			return ipcRenderer.sendSync('electron-store-get', property);
		},
		set(property: string, val: any) {
			ipcRenderer.send('electron-store-set', property, val);
		},
		del(property: string) {
			ipcRenderer.send('electron-store-del', property);
		}
		// Other method you want to add like has(), reset(), etc.
	},
	projects   : {
		getAll(property: string) {
			return ipcRenderer.sendSync('electron-project-getAll', property);
		},
		getProject(id: number) {
			ipcRenderer.send('electron-project-getProject', id);
		},
		scan() {
			ipcRenderer.send('electron-project-scan');
		},
		add(property: string) {
			ipcRenderer.send('electron-project-add', property);
		}
		// Other method you want to add like has(), reset(), etc.
	}
};
contextBridge.exposeInMainWorld('electron', bridge);
