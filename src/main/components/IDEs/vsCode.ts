import { shell }                from 'electron';
import { exec }                 from 'child_process';
import { IDEType, ProjectType } from '../../../types/project';

export class vsCode implements IDEType {
	public cmd: string;
	public id: number;
	public name: string;
	public path: string;

	async isInstalled() {
		return (new Promise((resolve) => {
			exec('where code', (error) => {
				if (error) {
					resolve(false);
					return;
				}
				resolve(true);
			});
		})) as Promise<boolean>;
	}

	async execute(project: ProjectType) {
		return shell.openPath(`vscode://file/${project.path}`);
	}

	constructor(data: IDEType) {
		this.id   = data.id;
		this.name = data.name;
		this.path = data.path;
		this.cmd  = data.cmd;
	}

}
