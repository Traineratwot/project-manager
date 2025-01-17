import React             from 'react';
import { Ripple }        from 'primereact/ripple';
import '../../styles/TerminalItem.scss';
import useLogo                        from '../hooks/useLogo';
import { ProgramFields, ProgramType } from '../../../types/project';


const ProgramItem = (props: { program: ProgramFields, onSelect: (e: React.MouseEvent<HTMLDivElement>, program: ProgramFields) => void }) => {
	const { program, onSelect } = props;
	const logo                  = useLogo({
											  type : ProgramType.terminal,
											  name : program.name,
											  color: program.color,
											  logo : program.logo
										  });
	return (
		<div className='ProgramItem' id={`program-item-${program.id}`} onClick={e => onSelect(e, program)}>
			<li className='item p-ripple' key={program.id}>
				<Ripple />
				<div>
					{logo}
					<div className='info'>
						<div className='tp name' data-pr-tooltip={program.name}>{program.label}</div>
					</div>
				</div>
			</li>
		</div>
	);
};

export default ProgramItem;
