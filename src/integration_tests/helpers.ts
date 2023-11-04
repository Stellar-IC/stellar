export function assertResultOk<ResultT>(
  result: { ok: ResultT } | { err: unknown },
  message?: string
): { ok: ResultT } {
  if (!('ok' in result)) {
    throw new Error(
      message ||
        `Expected result to be ok, but got error: ${JSON.stringify(result.err)}`
    );
  }

  return result;
}

export function assertResultErr<ErrorT>(
  result: { ok: unknown } | { err: ErrorT },
  message?: string
): { err: ErrorT } {
  if (!('err' in result)) {
    throw new Error(message || 'Expected error result');
  }

  return result;
}
