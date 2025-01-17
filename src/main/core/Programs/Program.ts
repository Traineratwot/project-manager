import { exec, ExecOptions }                              from 'child_process';
import { app }                                            from 'electron';
import Path                                               from 'path';
import path                                               from 'path';
import ejs                                                from 'ejs';
import PM_Storage, { Tables }                             from '../Storage/PM_Storage';
import PM_FileSystem                                      from '../Utils/PM_FileSystem';
import { Project }                                        from '../Projects/Project';
import { ProgramCommandVars, ProgramFields, ProgramType } from '../../../types/project';
import * as toml                                          from 'toml';
import md5                                                from 'md5';
import fs                                                 from 'fs/promises';

export class Program implements ProgramFields {
	readonly table                = Tables.programs;
	public id: number             = 0;
	public executePath: string    = '';
	public executeCommand: string = '';
	public name: string           = ''; // unique identifier
	public label: string          = ''; // user-friendly program name or language key
	public hash: string           = ''; // hash of program name
	public logo: string           = ''; // icon program
	public color: string          = ''; // background color for icon
	public isNew: boolean         = true;
	public type: ProgramType;
	public project?: Project;

	constructor(type: ProgramType) {
		this.type = type;
	}

	getName(): string {
		return this.name;
	}

	setName(value: string) {
		this.name = value;
		return this;
	}

	getLabel(): string {
		return this.label;
	}

	getExecutePath(): string {
		return this.executePath;
	}

	setExecutePath(value: string) {
		this.executePath = value;
		return this;
	}
	setExecuteCommand(value: string) {
		this.executeCommand = value;
		return this;
	}

	setLabel(value: string) {
		this.label = value;
		return this;
	}

	setProject(project: Project) {
		this.project = project;
	}

	getLogo(): string {
		if (this.logo) {
			return this.logo;
		}
		return '';
	}

	getColor(): string {
		return this.color;
	}

	getType(): string {
		return this.type;
	}

	setLogo(value: string) {
		this.logo = value;
		return this;
	}

	setColor(value: string) {
		this.color = value;
		return this;
	}

	async run() {
		const options: ExecOptions = {};
		if (this.project && this.project.getVal('path')) {
			options.cwd = this.project.getVal('path');
		}
		const commands = this.execParse();
		return Promise.all(
			commands.map((cmd) => {
				if (!cmd) return true;
				return new Promise((resolve, reject) => {
					exec(cmd, options, (error, stdout, stderr) => {
						if (error) {
							resolve(stdout);
						} else {
							reject(stderr);
						}
					});
				});
			})
		);
	}

	static getVars(program: Program, project?: Project): ProgramCommandVars {
		const RESULT: ProgramCommandVars = {};

		const projectData: {
			[p: string]: string | { [k: string]: string } | undefined
			PROJECT_ENV: { [k: string]: string } | undefined,
		} = {
			PROJECT_NAME : undefined,
			PROJECT_PATH : undefined,
			PROJECT_DESC : undefined,
			PROJECT_ENV  : undefined,
			PROJECT_COLOR: undefined
		};
		if (project) {
			projectData.PROJECT_NAME = project.getVal<string>('name');
			projectData.PROJECT_PATH = project.getVal<string>('path');
			projectData.PROJECT_DESC = project.getVal<string>('description');
			try {
				const env = project.getVal<string>('env');
				if (env) {
					projectData.PROJECT_ENV = toml.parse(env);
				}
			} catch (e) {

			}
			projectData.PROJECT_COLOR = project.getVal<string>('color');
		}
		const ProgramData: { [p: string]: string | undefined } = {};
		ProgramData.PROGRAM_PATH                               = program.executePath;
		ProgramData.PROGRAM_NAME                               = program.name;
		ProgramData.PROGRAM_TYPE                               = program.type;
		Object.keys(process.env).forEach((key) => {
			RESULT[key] = process.env[key];
		});
		Object.keys(ProgramData).forEach((key) => {
			RESULT[key] = ProgramData[key];
		});
		Object.keys(projectData).forEach((key) => {
			RESULT[key] = projectData[key];
		});
		return RESULT;
	}

	public execParse(): string[] {
		let output  = ejs.render(this.executeCommand, Program.getVars(this, this.project));
		let output2 = output.replaceAll('\r', '\n').replaceAll('\n\n', '\n').split('\n');
		return output2.filter((value) => !!value.trim());
	}

	async check(): Promise<boolean> {
		if (this.isNew) {
			throw new Error('Is new');
		}
		return PM_FileSystem.fileExists(this.executePath);
	}

	toObject(): ProgramFields {
		return {
			executePath   : this.executePath,
			type          : this.type,
			id            : this.id,
			color         : this.color,
			logo          : this.logo,
			name          : this.name,
			label         : this.label,
			executeCommand: this.executeCommand
		};
	}

	static fromId(id: number) {
		const data = PM_Storage.getById<ProgramFields>(Tables.programs, id);
		if (!data) {
			throw new Error('Invalid program id');
		}
		const p          = new Program(data.type);
		p.id             = id;
		p.executePath    = data.executePath;
		p.executeCommand = data.executeCommand;
		p.setColor(data.color);
		p.setName(data.name);
		p.setLabel(data.label);
		p.setLogo(data.logo);
		p.isNew = false;
		return p;
	}

	static async fromPath(path: string, type: ProgramType) {
		if (!await PM_FileSystem.fileExists(path)) {
			throw new Error('Invalid path');
		}
		const p       = new Program(type);
		p.executePath = path;
		p.setName(Path.basename(path, Path.extname(path)));
		p.isNew = false;
		return p;
	}

	async save() {
		if (!this.id) {
			this.id = PM_Storage.getNextId(this.table);
		}
		if (!this.name) {
			throw new Error('Invalid program name');
		}
		if (!this.hash) {
			this.hash = md5(this.name);
		}
		if (!this.label) {
			this.label = this.name;
		}
		if (!this.executePath) {
			throw new Error('Invalid program executePath');
		}
		if (!this.executeCommand) {
			switch (this.type) {
				case ProgramType.ide:
				case ProgramType.terminal:
					this.executeCommand = '"<%-PROGRAM_PATH%>" "<%-PROJECT_PATH%>"';
					break;
				default:
					this.executeCommand = '';
					break;
			}
		}
		if (!this.color) {
			this.color = 'transparent';
		}
		if (!this.logo) {
			let logoPath = path.join(app.getPath('userData'), 'programIcons', `${this.hash}.ico`);
			if (!await PM_FileSystem.exists(logoPath)) {
				const data = await PM_FileSystem.getIconByFile(this.executePath);
				let ext    = '.ico';
				switch (data.charAt(0)) {
					case '/':
						ext = '.jpg';
						break;
					case 'i':
						ext = '.png';
						break;
					case 'R':
						ext = '.gif';
						break;
					case 'U':
						ext = '.webp';
						break;
				}
				logoPath = path.join(app.getPath('userData'), 'programIcons', `${this.hash}${ext}`).replaceAll('\\', '/');
				await PM_FileSystem.writeFile(logoPath, data, 'base64');
			}
			this.logo = logoPath;
		}
		PM_Storage.commit<ProgramFields>(this.table, this.id, {
			id            : this.id,
			executePath   : this.executePath,
			executeCommand: this.executeCommand,
			name          : this.name,
			label         : this.label,
			logo          : this.logo,
			color         : this.color,
			type          : this.type
		}, ['name', 'id', 'executePath']);
		return this;
	}

	async delete() {
		if (!this.isNew) {
			if (await PM_FileSystem.fileExists(this.getLogo())) {
				await fs.unlink(this.getLogo());
			}
			PM_Storage.delById(Tables.programs, this.id);
		}
	}
}

export default Program;
