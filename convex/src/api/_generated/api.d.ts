/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as customization from "../customization.js";
import type * as dispatches from "../dispatches.js";
import type * as hydrants from "../hydrants.js";
import type * as transformations from "../transformations.js";
import type * as viewToken from "../viewToken.js";
import type * as weather from "../weather.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  customization: typeof customization;
  dispatches: typeof dispatches;
  hydrants: typeof hydrants;
  transformations: typeof transformations;
  viewToken: typeof viewToken;
  weather: typeof weather;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
