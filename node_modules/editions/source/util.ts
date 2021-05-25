// As Errlop uses Editions, we should use a specific Errlop edition
// As otherwise, the circular reference may fail on some machines
// https://github.com/bevry/errlop/issues/2
import Errlop from 'errlop'

interface ErrtionOptions {
	/** The message to use for the error */
	message: string
	/** The code to categorise the error */
	code: string | number
	/** The severity level of the error */
	level?: string | number
}

export interface Errtion extends Errlop, ErrtionOptions {}

/**
 * Allow code and level inputs on Errlop.
 * We do this instead of a class extension, as class extensions do not interop well on node 0.8, which is our target.
 */
export function errtion(
	this: void,
	opts: ErrtionOptions,
	parent?: Errlop | Error
): Errtion {
	const { code, level } = opts
	let { message } = opts
	if (code) message = `${code}: ${message}`
	if (level) message = `${level}: ${message}`
	const error = new Errlop(message, parent) as Errtion
	if (code) error.code = code
	if (level) error.level = level
	return error
}
