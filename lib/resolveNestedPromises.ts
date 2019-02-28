/* tslint:disable */

const promiseMap = function mapImpl(
  promiseList: any,
  functor: any,
  options: any
) {
  return Promise.all(
    promiseList.map((promiseOrValue: any) =>
      Promise.resolve(promiseOrValue).then(functor)
    )
  )
}

const promiseProps = function propsImpl(obj: any, options: any) {
  const promisesToResolve: any[] = []
  Object.keys(obj).map(key => {
    const promise = Promise.resolve(obj[key]).then(val => {
      obj[key] = val
    })
    promisesToResolve.push(promise)
  })
  return Promise.all(promisesToResolve).then(() => obj)
}

export default function resolveNestedPromises(
  obj: any,
  options: any,
  maxDepth = 6
) {
  if (maxDepth === 0) {
    return Promise.resolve(obj)
  }
  maxDepth -= 1

  return Promise.resolve(obj).then(obj => {
    if (Array.isArray(obj)) {
      return promiseMap(
        obj,
        (obj: any) => resolveNestedPromises(obj, options, maxDepth),
        options
      )
    } else if (obj && typeof obj === 'object' && obj.constructor === Object) {
      const obj2: any = {}
      for (const key in obj) {
        obj2[key] = resolveNestedPromises(obj[key], options, maxDepth)
      }
      return promiseProps(obj2, options)
    }
    return obj
  })
}
