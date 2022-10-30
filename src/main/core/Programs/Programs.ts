import { ipcMain }                    from 'electron';
import PM_Storage, { Tables }         from '../Storage/PM_Storage';
import { Program }                    from './Program';
import { BackgroundEvents }                              from '../../../types/Events';
import { ProgramFields, ProgramFieldsKeys, ProgramType } from '../../../types/project';
import APP                                               from '../../main';
import PM_FileSystem                  from '../Utils/PM_FileSystem';
import fs                             from 'fs/promises';

export class Programs {
	private static instance: Programs;

	public programsData: { [p: string]: ProgramFields } | undefined;

	constructor() {
		this.programsData = PM_Storage.getAll<ProgramFields>(Tables.programs);
		ipcMain.on(BackgroundEvents.ProgramsGetAll, (event, type?: ProgramType) => {
			event.returnValue = this.getPrograms(type);
		});
		ipcMain.on(BackgroundEvents.ProgramCreate, async (event, data: { path: string, type: ProgramType }) => {
			event.returnValue = (await Program.fromPath(data.path, data.type)).save();
			setTimeout(() => {
				APP.sendRenderEvent(BackgroundEvents.ProgramUpdate);
			}, 200);
		});
		ipcMain.on(BackgroundEvents.ProgramEdit, async (_event, data: { id: number, key: ProgramFieldsKeys, value: any }) => {
			if (!data.id) {
				throw new Error('Program not found');
			}
			const program = Program.fromId(data.id);
			switch (data.key) {
				case 'color':
					program.setColor(data.value);
					break;
				case 'name':
					program.setName(data.value);
					break;
				case 'label':
					program.setLabel(data.value);
					break;
				case 'logo':
					program.setLogo(data.value);
					break;
			}
			await program.save();
			setTimeout(() => {
				APP.sendRenderEvent(BackgroundEvents.ProgramUpdate);
			}, 200);
		});
		ipcMain.on(BackgroundEvents.ProgramDelete, async (_event, id: number) => {
			const p = Program.fromId(id);
			if (!p.isNew) {
				if (await PM_FileSystem.fileExists(p.getLogo())) {
					await fs.unlink(p.getLogo());
				}
				PM_Storage.delById(Tables.programs, id);
			}
			setTimeout(() => {
				APP.sendRenderEvent(BackgroundEvents.ProgramUpdate);
			}, 200);
		});
	}

	public async init() {
		PM_Storage.init(Tables.programs);
		console.log('Programs INIT');
	}

	static getInstance() {
		if (!this.instance) {
			this.instance = new Programs();
		}
		return this.instance;
	}

	getPrograms(type?: ProgramType) {
		this.programsData                            = PM_Storage.getAll<ProgramFields>(Tables.programs);
		const list: { [key: string]: ProgramFields } = {};
		if (this.programsData) {
			for (const key in this.programsData) {
				const data = this.programsData[key];
				if (data.name) {
					if (!type || type === data.type) {
						list[key] = (Program.fromId(parseInt(key)).toObject());
					}
				}
			}
		}
		return list;
	}

}

export default Programs.getInstance();
