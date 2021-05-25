import versionCompare from 'version-compare'

export type Version = string | number
export type Range = Version | Version[]

const regex = /^([<>=]*)\s*([\d.]+)\s*$/

/**
 * Compare two versions quickly.
 * @param current Is this version greater, equal to, or less than the other?
 * @param other The version to compare against the current version
 * @return 1 if current is greater than other, 0 if they are equal or equivalent, and -1 if current is less than other
 */
export default function withinVersionRange(
	subject: Version,
	range: Range
): boolean {
	let result: boolean = false
	if (!Array.isArray(range)) range = String(range).split(/\s*\|\|\s*/)
	for (const part of range) {
		const parts = String(part).match(regex) || []
		const [_, comparator, version] = parts
		if (!version)
			throw new Error(`version range was invalid: ${JSON.stringify(part)}`)
		const diff = versionCompare(subject, version)
		let pass: boolean = false
		switch (comparator) {
			case '>=':
				pass = diff >= 0
				break
			case '>':
				pass = diff === 1
				break
			case '<':
				pass = diff === -1
				break
			case '<=':
				pass = diff <= 0
				break
			case '=':
			case '':
				pass = diff === 0
				break
			default:
				throw new Error(
					`version range comparator was invalid: ${JSON.stringify(part)}`
				)
		}
		if (pass) result = true
	}
	return result
}
