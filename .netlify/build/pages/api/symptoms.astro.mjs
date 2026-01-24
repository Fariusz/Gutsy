export { renderers } from '../../renderers.mjs';

var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
  LogLevel2[LogLevel2["INFO"] = 1] = "INFO";
  LogLevel2[LogLevel2["WARN"] = 2] = "WARN";
  LogLevel2[LogLevel2["ERROR"] = 3] = "ERROR";
  return LogLevel2;
})(LogLevel || {});
class Logger {
  static instance;
  logLevel = 1 /* INFO */;
  constructor() {
  }
  static getInstance() {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  setLogLevel(level) {
    this.logLevel = level;
  }
  shouldLog(level) {
    return level >= this.logLevel;
  }
  formatMessage(entry) {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
    return `[${timestamp}] ${levelName}: ${entry.message}${contextStr}`;
  }
  log(entry) {
    if (!this.shouldLog(entry.level)) {
      return;
    }
    const formattedMessage = this.formatMessage(entry);
    switch (entry.level) {
      case 0 /* DEBUG */:
        console.debug(formattedMessage);
        break;
      case 1 /* INFO */:
        console.info(formattedMessage);
        break;
      case 2 /* WARN */:
        console.warn(formattedMessage);
        break;
      case 3 /* ERROR */:
        console.error(formattedMessage);
        break;
    }
  }
  debug(message, context) {
    this.log({
      level: 0 /* DEBUG */,
      message,
      timestamp: /* @__PURE__ */ new Date(),
      context
    });
  }
  info(message, context) {
    this.log({
      level: 1 /* INFO */,
      message,
      timestamp: /* @__PURE__ */ new Date(),
      context
    });
  }
  warn(message, context) {
    this.log({
      level: 2 /* WARN */,
      message,
      timestamp: /* @__PURE__ */ new Date(),
      context
    });
  }
  error(message, context) {
    this.log({
      level: 3 /* ERROR */,
      message,
      timestamp: /* @__PURE__ */ new Date(),
      context
    });
  }
}
const logger = Logger.getInstance();
({
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger)
});

class SymptomRepository {
  constructor(supabase) {
    this.supabase = supabase;
  }
  /**
   * Get all symptoms from the database
   * @returns Array of symptoms
   */
  async getAllSymptoms() {
    try {
      const { data, error } = await this.supabase.from("symptoms").select("id, name");
      if (error) {
        logger.error("Supabase error fetching symptoms", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Database error: ${error.message}`);
      }
      if (!data) {
        logger.warn("No symptoms data returned from database");
        return [];
      }
      logger.info(`Successfully fetched ${data.length} symptoms`);
      return data.map((symptom) => ({
        id: symptom.id,
        name: symptom.name
      }));
    } catch (error) {
      logger.error("Repository error in getAllSymptoms", { error });
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Unexpected error fetching symptoms");
    }
  }
}

class SymptomService {
  constructor(supabase) {
    this.supabase = supabase;
    this.symptomRepository = new SymptomRepository(supabase);
  }
  symptomRepository;
  /**
   * Get all symptoms
   * @returns SymptomsResponse with all available symptoms
   */
  async getAllSymptoms() {
    try {
      logger.debug("SymptomService: Starting getAllSymptoms");
      const symptoms = await this.symptomRepository.getAllSymptoms();
      logger.info(`SymptomService: Successfully retrieved ${symptoms.length} symptoms`);
      return { data: symptoms };
    } catch (error) {
      logger.error("SymptomService error in getAllSymptoms", { error });
      const errorMessage = error instanceof Error ? error.message : "Failed to retrieve symptoms";
      return { data: [], error: errorMessage };
    }
  }
}

const prerender = false;
async function GET(context) {
  try {
    console.log("Symptoms API: Starting request");
    const {
      data: { user },
      error: userError
    } = await context.locals.supabase.auth.getUser();
    if (userError) {
      console.error("User authentication error:", userError);
      return new Response(
        JSON.stringify({
          error: {
            type: "authorization_error",
            message: "Authentication error: " + userError.message
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (!user) {
      console.log("No authenticated user found");
      return new Response(
        JSON.stringify({
          error: {
            type: "authorization_error",
            message: "Authentication required"
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    console.log("User authenticated:", user.id);
    const symptomService = new SymptomService(context.locals.supabase);
    const response = await symptomService.getAllSymptoms();
    console.log("Service response:", {
      hasData: !!response.data,
      dataLength: response.data?.length,
      hasError: !!response.error
    });
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Symptoms API error:", error);
    return new Response(
      JSON.stringify({
        error: {
          type: "server_error",
          message: error instanceof Error ? error.message : "Internal server error"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
