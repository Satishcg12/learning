import { getDb } from "@utils/db.ts";
import { PoolClient } from "jsr:@db/postgres";

/**
 * Type for query binding values
 */
type BindingValue = string | number | boolean | Date | null | undefined;

/**
 * Interface for pagination result
 */
interface PaginationInfo {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  from: number | null;
  to: number | null;
}

/**
 * Interface for paginated data
 */
interface PaginatedData<T> {
  data: T[];
  pagination: PaginationInfo;
}

/**
 * Interface for where clause
 */
interface WhereClause {
  type: string;
  clause: string;
  bindings: BindingValue[];
}

/**
 * Interface for having clause
 */
interface HavingClause {
  clause: string;
  bindings: BindingValue[];
}

/**
 * Query types for buildQuery method
 */
type QueryType = "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "COUNT";

/**
 * Sort direction for orderBy
 */
type SortDirection = "ASC" | "DESC";

/**
 * Base Model class providing an ORM-like query builder
 */
export class Model<T extends object = Record<string, unknown>> {
  protected table: string;
  protected fillable: string[] = [];
  protected primaryKey: string = "id";

  // Query state properties
  protected client: PoolClient | null = null;
  protected isTransaction: boolean = false;
  protected selectColumns: string[] = ["*"];
  protected whereClauses: WhereClause[] = [];
  protected joinClauses: string[] = [];
  protected orderByClauses: string[] = [];
  protected groupByColumns: string[] = [];
  protected havingInfo: HavingClause | null = null;
  protected limitValue: number | null = null;
  protected offsetValue: number | null = null;

  constructor(table: string) {
    this.table = table;
  }

  // Transaction methods
  async beginTransaction(): Promise<Model<T>> {
    const db = getDb();
    this.client = await db.getClient();
    await this.client.queryArray("BEGIN");
    this.isTransaction = true;
    return this;
  }

  async commit(): Promise<void> {
    if (this.isTransaction && this.client) {
      await this.client.queryArray("COMMIT");
      this.client.release();
      this.client = null;
      this.isTransaction = false;
    }
  }

  async rollback(): Promise<void> {
    if (this.isTransaction && this.client) {
      await this.client.queryArray("ROLLBACK");
      this.client.release();
      this.client = null;
      this.isTransaction = false;
    }
  }

  async transaction<R>(callback: (model: Model<T>) => Promise<R>): Promise<R> {
    await this.beginTransaction();
    try {
      const result = await callback(this);
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  // Build and execute queries
  protected buildQuery(
    type: QueryType,
    data?: Partial<T>,
  ): { query: string; bindings: BindingValue[] } {
    let sql = "";
    const bindings: BindingValue[] = [];

    // Helper to add WHERE clauses
    const buildWhereClause = (): string => {
      if (this.whereClauses.length === 0) return "";
      let bindingIndex = bindings.length + 1;

      const conditions = this.whereClauses.map((wc) => {
        let clause = wc.clause;
        // Replace ? placeholders with $n
        wc.bindings.forEach((val) => {
          clause = clause.replace("?", `$${bindingIndex++}`);
          bindings.push(val);
        });
        return `(${clause})`;
      }).join(" AND ");

      return ` WHERE ${conditions}`;
    };

    // Helper to build other parts of the query
    const buildJoins = (): string =>
      this.joinClauses.length ? " " + this.joinClauses.join(" ") : "";
    const buildGroupBy = (): string =>
      this.groupByColumns.length
        ? ` GROUP BY ${this.groupByColumns.join(", ")}`
        : "";
    const buildOrderBy = (): string =>
      this.orderByClauses.length
        ? ` ORDER BY ${this.orderByClauses.join(", ")}`
        : "";
    const buildLimit = (): string =>
      this.limitValue !== null ? ` LIMIT ${this.limitValue}` : "";
    const buildOffset = (): string =>
      this.offsetValue !== null ? ` OFFSET ${this.offsetValue}` : "";
    const buildHaving = (): string => {
      if (!this.havingInfo) return "";
      let bindingIndex = bindings.length + 1;
      let clause = this.havingInfo.clause;

      this.havingInfo.bindings.forEach((val) => {
        clause = clause.replace("?", `$${bindingIndex++}`);
        bindings.push(val);
      });

      return ` HAVING ${clause}`;
    };

    switch (type) {
      case "SELECT": {
        sql = `SELECT ${this.selectColumns.join(", ")} FROM ${this.table}`;
        sql += buildJoins();
        sql += buildWhereClause();
        sql += buildGroupBy();
        sql += buildHaving();
        sql += buildOrderBy();
        sql += buildLimit();
        sql += buildOffset();
        break;
      }

      case "COUNT": {
        sql = `SELECT COUNT(${
          this.selectColumns[0] ?? "*"
        }) as total FROM ${this.table}`;
        sql += buildJoins();
        sql += buildWhereClause();
        sql += buildGroupBy();
        sql += buildHaving();
        break;
      }
      case "INSERT": {
        if (!data) throw new Error("Data required for INSERT");
        const insertData = this.filterFillable(data);
        const cols = Object.keys(insertData);
        const vals = Object.values(insertData) as BindingValue[];
        const params = cols.map((_, i) => `$${i + 1}`).join(", ");

        sql = `INSERT INTO ${this.table} (${
          cols.join(", ")
        }) VALUES (${params}) RETURNING *`;
        bindings.push(...vals);
        break;
      }

      case "UPDATE": {
        if (!data) throw new Error("Data required for UPDATE");
        const updateData = this.filterFillable(data);
        const setCols = Object.keys(updateData);
        const setVals = Object.values(updateData) as BindingValue[];

        sql = `UPDATE ${this.table} SET ` +
          setCols.map((col, i) => `${col} = $${i + 1}`).join(", ");
        bindings.push(...setVals);

        sql += buildWhereClause();
        if (!this.whereClauses.length) {
          console.warn("Update without WHERE updates all records");
        }
        sql += " RETURNING *";
        break;
      }

      case "DELETE": {
        sql = `DELETE FROM ${this.table}`;
        sql += buildWhereClause();
        if (!this.whereClauses.length) {
          console.warn("Delete without WHERE deletes all records");
        }
        sql += " RETURNING *";
        break;
      }
      default: {
        throw new Error(`Unsupported query type: ${type}`);
      }
    }

    return { query: sql, bindings };
  }

  protected filterFillable(data: Partial<T>): Partial<T> {
    if (!this.fillable.length) return data;

    const filtered: Partial<T> = {};
    for (const key of this.fillable) {
      if (key in data) {
        // Type assertion needed here since we can't guarantee key is in T with just 'object' constraint
        (filtered as Record<string, unknown>)[key] =
          (data as Record<string, unknown>)[key];
      }
    }
    return filtered;
  }

  protected async execute<R>(
    query: string,
    bindings: BindingValue[],
  ): Promise<R[]> {
    try {
      const db = getDb();
      const client = this.client ?? await db.getClient();

      const result = await client.queryObject<R>(query, bindings);
      if (!this.isTransaction) client.release();

      this.resetQueryState();
      return result.rows;
    } catch (error) {
      console.error("Query error:", error);
      this.resetQueryState();
      throw error;
    }
  }

  protected resetQueryState(): void {
    this.selectColumns = ["*"];
    this.whereClauses = [];
    this.joinClauses = [];
    this.orderByClauses = [];
    this.groupByColumns = [];
    this.havingInfo = null;
    this.limitValue = null;
    this.offsetValue = null;
  }

  protected cloneState(): Model<T> {
    const clone = new Model<T>(this.table);
    clone.selectColumns = [...this.selectColumns];
    clone.whereClauses = this.whereClauses.map((wc) => ({
      ...wc,
      bindings: [...wc.bindings],
    }));
    clone.joinClauses = [...this.joinClauses];
    clone.orderByClauses = [...this.orderByClauses];
    clone.groupByColumns = [...this.groupByColumns];
    clone.havingInfo = this.havingInfo
      ? {
        clause: this.havingInfo.clause,
        bindings: [...this.havingInfo.bindings],
      }
      : null;
    clone.limitValue = this.limitValue;
    clone.offsetValue = this.offsetValue;
    clone.fillable = [...this.fillable];
    clone.primaryKey = this.primaryKey;
    return clone;
  }

  // Query building methods
  select(...columns: string[]): Model<T> {
    this.selectColumns = columns.length ? columns : ["*"];
    return this;
  }

  where(
    column: string,
    operator: string | BindingValue,
    value?: BindingValue,
  ): Model<T> {
    const actualOperator = value === undefined ? "=" : operator;
    const actualValue = value === undefined ? operator : value;
    this.whereClauses.push({
      type: "basic",
      clause: `${column} ${actualOperator} ?`,
      bindings: [actualValue],
    });
    return this;
  }

  whereRaw(sql: string, bindings: BindingValue[] = []): Model<T> {
    this.whereClauses.push({ type: "raw", clause: sql, bindings });
    return this;
  }

  whereIn(column: string, values: BindingValue[]): Model<T> {
    if (!values.length) return this.whereRaw("1 = 0");
    const placeholders = values.map(() => "?").join(", ");
    this.whereClauses.push({
      type: "in",
      clause: `${column} IN (${placeholders})`,
      bindings: values,
    });
    return this;
  }

  whereNotIn(column: string, values: BindingValue[]): Model<T> {
    if (!values.length) return this;
    const placeholders = values.map(() => "?").join(", ");
    this.whereClauses.push({
      type: "notIn",
      clause: `${column} NOT IN (${placeholders})`,
      bindings: values,
    });
    return this;
  }

  whereNull(column: string): Model<T> {
    this.whereClauses.push({
      type: "null",
      clause: `${column} IS NULL`,
      bindings: [],
    });
    return this;
  }

  whereNotNull(column: string): Model<T> {
    this.whereClauses.push({
      type: "notNull",
      clause: `${column} IS NOT NULL`,
      bindings: [],
    });
    return this;
  }

  limit(limit: number): Model<T> {
    this.limitValue = limit;
    return this;
  }

  offset(offset: number): Model<T> {
    this.offsetValue = offset;
    return this;
  }

  orderBy(column: string, direction: SortDirection = "ASC"): Model<T> {
    this.orderByClauses.push(`${column} ${direction.toUpperCase()}`);
    return this;
  }

  groupBy(...columns: string[]): Model<T> {
    this.groupByColumns.push(...columns);
    return this;
  }

  having(condition: string, bindings: BindingValue[] = []): Model<T> {
    this.havingInfo = { clause: condition, bindings };
    return this;
  }

  innerJoin(
    table: string,
    firstColumn: string,
    operator: string,
    secondColumn: string,
  ): Model<T> {
    this.joinClauses.push(
      `INNER JOIN ${table} ON ${firstColumn} ${operator} ${secondColumn}`,
    );
    return this;
  }

  leftJoin(
    table: string,
    firstColumn: string,
    operator: string,
    secondColumn: string,
  ): Model<T> {
    this.joinClauses.push(
      `LEFT JOIN ${table} ON ${firstColumn} ${operator} ${secondColumn}`,
    );
    return this;
  }

  rightJoin(
    table: string,
    firstColumn: string,
    operator: string,
    secondColumn: string,
  ): Model<T> {
    this.joinClauses.push(
      `RIGHT JOIN ${table} ON ${firstColumn} ${operator} ${secondColumn}`,
    );
    return this;
  }

  joinRaw(join: string): Model<T> {
    this.joinClauses.push(join);
    return this;
  }

  // Execution methods
  async first<R = T>(): Promise<R | null> {
    this.limit(1);
    const { query, bindings } = this.buildQuery("SELECT");
    const results = await this.execute<R>(query, bindings);
    return results.length ? results[0] : null;
  }

  async getAll<R = T>(): Promise<R[]> {
    const { query, bindings } = this.buildQuery("SELECT");
    return await this.execute<R>(query, bindings);
  }

  find<R = T>(id: string | number): Promise<R | null> {
    this.resetQueryState();
    return this.where(this.primaryKey, id).first<R>();
  }

  findBy<R = T>(
    column: string,
    operator: string | BindingValue,
    value?: BindingValue,
  ): Promise<R[]> {
    this.resetQueryState();
    return this.where(column, operator, value).getAll<R>();
  }

  async insert<R = T>(data: Partial<T>): Promise<R> {
    const { query, bindings } = this.buildQuery("INSERT", data);
    const results = await this.execute<R>(query, bindings);
    return results[0];
  }

  async update<R = T>(data: Partial<T>): Promise<R[]> {
    const { query, bindings } = this.buildQuery("UPDATE", data);
    return await this.execute<R>(query, bindings);
  }

  async delete<R = T>(): Promise<R[]> {
    const { query, bindings } = this.buildQuery("DELETE");
    return await this.execute<R>(query, bindings);
  }

  async count(column: string = "*"): Promise<number> {
    const originalSelect = this.selectColumns;
    this.selectColumns = [column];

    const { query, bindings } = this.buildQuery("COUNT");
    this.selectColumns = originalSelect;

    const results = await this.execute<{ total: string | number }>(
      query,
      bindings,
    );
    return parseInt(String(results[0]?.total ?? "0"));
  }

  async exists(): Promise<boolean> {
    const clone = this.cloneState();
    clone.select("1").limit(1);

    const { query, bindings } = clone.buildQuery("SELECT");
    const results = await clone.execute<{ "1": number }>(query, bindings);
    return results.length > 0;
  }

  async truncate(cascade: boolean = false): Promise<void> {
    const sql = `TRUNCATE TABLE ${this.table}${cascade ? " CASCADE" : ""}`;
    await this.execute<never>(sql, []);
  }

  async raw<R>(sql: string, bindings: BindingValue[] = []): Promise<R[]> {
    this.resetQueryState();
    return await this.execute<R>(sql, bindings);
  }

  async selectRaw<R>(sql: string, bindings: BindingValue[] = []): Promise<R[]> {
    return await this.raw<R>(sql, bindings);
  }

  async paginate<R = T>(
    page: number = 1,
    perPage: number = 15,
  ): Promise<PaginatedData<R>> {
    // Get total count first
    const countModel = this.cloneState();
    const total = await countModel.count();

    // Get paginated data
    this.limit(perPage).offset((page - 1) * perPage);
    const data = await this.getAll<R>();

    // Calculate pagination info
    const lastPage = Math.ceil(total / perPage);
    const from = total > 0 ? (page - 1) * perPage + 1 : null;
    const to = total > 0 ? Math.min(page * perPage, total) : null;

    return {
      data,
      pagination: { total, perPage, currentPage: page, lastPage, from, to },
    };
  }
}
