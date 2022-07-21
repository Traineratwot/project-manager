import { useMemo }     from 'react';
import * as JsSearch   from 'js-search';
import { ProjectType } from '../../../types/project';

export const useSearch = (props: { projects: { [key: string]: ProjectType }, searchString: string }):ProjectType[] => {
	const { projects, searchString } = props;
	const projectList                = Object.values(projects);

	const search = useMemo(() => {
		const search = new JsSearch.Search('id');
		search.addIndex('name');
		search.addIndex('description');
		search.addDocuments(projectList);
		return search;
	}, [projectList]);

	return useMemo(() => {
		if (searchString) {
			return search.search(searchString) as ProjectType[];
		}
		return projectList;
	}, [projectList, search, searchString]);
};
export default useSearch;
