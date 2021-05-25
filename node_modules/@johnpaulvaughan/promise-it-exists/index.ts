import * as fs from 'fs'

/**
 * Checks to ensure that the filepath exists. Resolves or rejects a Promise
 *
 * @param  String
 * @return Promise<string>
 */
export function exists(filepath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		fs.access(filepath, (err) => {
			if (!err) resolve(filepath)
			else reject(new Error('File does not exist'))
		})
	})
}