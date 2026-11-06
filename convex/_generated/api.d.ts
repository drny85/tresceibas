/* eslint-disable */
  /**
   * Generated `api` utility.
   *
   * THIS CODE IS AUTOMATICALLY GENERATED.
   *
   * To regenerate, run `npx convex dev`.
   * @module
   */
  
  import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";
  import type * as activities from "../activities.js";
import type * as admin from "../admin.js";
import type * as committee from "../committee.js";
import type * as donations from "../donations.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as lib_admin from "../lib/admin.js";
import type * as lib_money from "../lib/money.js";
import type * as payments from "../payments.js";
import type * as projects from "../projects.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";

  /**
   * A utility for referencing Convex functions in your app's API.
   *
   * Usage:
   * ```js
   * const myFunctionReference = api.myModule.myFunction;
   * ```
   */
  declare const fullApi: ApiFromModules<{
    "activities": typeof activities,
"admin": typeof admin,
"committee": typeof committee,
"donations": typeof donations,
"files": typeof files,
"http": typeof http,
"lib/admin": typeof lib_admin,
"lib/money": typeof lib_money,
"payments": typeof payments,
"projects": typeof projects,
"seed": typeof seed,
"settings": typeof settings,
  }>;
  export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;
  export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;
  