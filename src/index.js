class PolicyNotAuthorizedError extends Error {};

const policy = (user, record) => (
  new (record.constructor.policy || record.policy)(user, record)
)

const check = (user, record, action, ...args) => (
  !!policy(user, record)[action](...args)
)

const ensure = (...params) => {
  if (!check(...params)) throw new PolicyNotAuthorizedError
}

const policyScope = (user, scope) => (
  new scope.policy.Scope(user, scope).resolve()
)

module.exports = {
  policy,
  check,
  ensure,
  policyScope,
  PolicyNotAuthorizedError
}
