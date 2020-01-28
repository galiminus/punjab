class PolicyNotAuthorizedError extends Error {};

const policy = (user, record) => (
  new record.sequelize.models[record._modelOptions.name.singular].policy(user, record)
);

const check = (user, record, action, ...args) => (
  policy(user, record)[action](...args)
)

const ensure = (...params) => {
  if (!check(...params)) throw new PolicyNotAuthorizedError
}

const policyScope = (user, scope) => (
  new scope.policy.Scope(user, scope)
)

module.exports = {
  policy,
  check,
  ensure,
  policyScope,
  PolicyNotAuthorizedError
}
