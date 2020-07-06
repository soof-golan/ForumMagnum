import * as _ from 'underscore';

/// Like _.filter, but with an async filter function. Given an array and an async function, return
/// an array containing the subset of the original array for which the filter returns true, in the
/// same order. Filters will be run on array elements in parallel (to the extent async is parallel).
/// This function assumes that the array is not modified in the background, and that the filter
/// doesn't care about execution order.
export const asyncFilter = async <T>(list: Array<T>, filter: (x:T)=>Promise<boolean>): Promise<Array<T>> => {
  const filterPromises: Array<Promise<boolean>> = list.map(filter);
  const filterMatches: Array<boolean> = await Promise.all(filterPromises);
  
  let result: Array<T> = [];
  for (let i=0; i<filterMatches.length; i++) {
    if (filterMatches[i])
      result.push(list[i]);
  }
  return result;
}

// Like _.map, but with a mapping function that is async. Runs the mapping
// functions sequentially.
export const asyncMapSequential = async <T,U>(list: Array<T>, fn: (x:T)=>Promise<U>): Promise<Array<U>> => {
  const result: Array<U> = [];
  for (const item of list)
    result.push(await fn(item));
  return result;
}

// Like _.map, but with a mapping function that is async. Runs the mapping
// functions in parallel, and returns when they have all finished.
export const asyncMapParallel = async <T,U>(list: Array<T>, fn: (x:T)=>Promise<U>): Promise<Array<U>> => {
  return await Promise.all(_.map(list, i=>fn(i)));
}
