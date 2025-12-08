"use client";

import * as fjs from "formulajs";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
// -------------------------------------------
// Short descriptions for common formulas
// (fallback will auto-generate for all others)
// -------------------------------------------
const FORMULA_DESCRIPTIONS = {
  ABS: "Returns the absolute value of a number.",
  ACCRINT: "Returns accrued interest for a security.",
  ACCRINTM: "Returns accrued interest at maturity.",
  ACOS: "Returns the arccosine of a number.",
  ACOSH: "Returns the inverse hyperbolic cosine.",
  ACOT: "Returns the arccotangent of a number.",
  ACOTH: "Returns the inverse hyperbolic cotangent.",
  ADD: "Adds two numbers.",
  AGGREGATE: "Applies an aggregate function with optional filtering.",
  AMORDEGRC: "Returns depreciation using the French accounting method.",
  AMORLINC: "Returns linear depreciation for each accounting period.",
  AND: "Returns TRUE if all arguments are TRUE.",
  ARABIC: "Converts a Roman numeral to an Arabic numeral.",
  ARGS2ARRAY: "Converts arguments into an array.",
  ASC: "Converts full-width characters to half-width.",
  ASIN: "Returns the arcsine of a number.",
  ASINH: "Returns the inverse hyperbolic sine.",
  ATAN: "Returns the arctangent of a number.",
  ATAN2: "Returns the arctangent from x and y coordinates.",
  ATANH: "Returns the inverse hyperbolic tangent.",
  AVEDEV: "Returns the average of absolute deviations.",
  AVERAGE: "Returns the average of numeric values.",
  AVERAGEA: "Returns the average, including text as 0.",
  AVERAGEIF: "Returns the average of cells that meet a condition.",
  AVERAGEIFS: "Returns the average of cells that meet multiple conditions.",
  BAHTTEXT: "Converts a number to Thai text.",
  BASE: "Converts a number to a different base.",
  BESSELI: "Returns the modified Bessel function (first kind).",
  BESSELJ: "Returns the Bessel function (first kind).",
  BESSELK: "Returns the modified Bessel function (second kind).",
  BESSELY: "Returns the Bessel function (second kind).",
  BETA: "Returns the beta function.",
  BETADIST: "Returns the beta distribution.",
  BETAINV: "Returns the inverse beta distribution.",
  BIN2DEC: "Converts a binary number to decimal.",
  BIN2HEX: "Converts a binary number to hexadecimal.",
  BIN2OCT: "Converts a binary number to octal.",
  BINOM: "Returns binomial distribution probability.",
  BINOMDIST: "Returns binomial probability distribution.",
  BITAND: "Returns bitwise AND of two numbers.",
  BITLSHIFT: "Returns a number shifted left by a specified number of bits.",
  BITOR: "Returns bitwise OR of two numbers.",
  BITRSHIFT: "Returns a number shifted right by a specified number of bits.",
  BITXOR: "Returns bitwise XOR of two numbers.",
  CEILING: "Rounds a number up to the nearest multiple.",
  CEILINGMATH: "Rounds a number up using math rules.",
  CEILINGPRECISE: "Rounds a number up to the nearest integer or multiple.",
  CELL: "Returns information about a cell.",
  CHAR: "Returns the character from a given code.",
  CHIDIST: "Returns the chi-squared distribution.",
  CHIDISTRT: "Returns the right-tailed chi-squared distribution.",
  CHIINV: "Returns the inverse chi-squared distribution.",
  CHIINVRT: "Returns the right-tailed inverse chi-squared distribution.",
  CHISQ: "Returns the chi-squared test statistic.",
  CHITEST: "Returns the test for independence.",
  CHOOSE: "Selects a value from a list by index.",
  CLEAN: "Removes non-printable characters from text.",
  CODE: "Returns the numeric code of a character.",
  COLUMN: "Returns the column number of a reference.",
  COLUMNS: "Returns the number of columns in a range.",
  COMBIN: "Returns the number of combinations.",
  COMBINA: "Returns combinations with repetition.",
  COMPLEX: "Creates a complex number from real and imaginary parts.",
  CONCATENATE: "Joins multiple text strings.",
  CONFIDENCE: "Returns a confidence interval for a mean.",
  CONVERT: "Converts a number from one unit to another.",
  CORREL: "Returns the correlation between two data sets.",
  COS: "Returns the cosine of a number.",
  COSH: "Returns the hyperbolic cosine.",
  COT: "Returns the cotangent of a number.",
  COTH: "Returns the hyperbolic cotangent.",
  COUNT: "Counts numeric values in a range.",
  COUNTA: "Counts non-empty values in a range.",
  COUNTBLANK: "Counts empty cells in a range.",
  COUNTIF: "Counts cells matching a condition.",
  COUNTIFS: "Counts cells matching multiple conditions.",
  COUNTIN: "Counts occurrences of a value inside an array.",
  COUNTUNIQUE: "Counts unique values in a range.",
  COUPDAYBS: "Returns the number of days from the coupon period to settlement.",
  COUPDAYS: "Returns the number of days in the coupon period.",
  COUPDAYSNC: "Returns the number of days from settlement to next coupon.",
  COUPNCD: "Returns the next coupon date after settlement.",
  COUPNUM: "Returns the number of coupons payable between two dates.",
  COUPPCD: "Returns the previous coupon date before settlement.",
  COVAR: "Returns covariance of two data sets.",
  COVARIANCE: "Returns covariance of two data sets.",
  COVARIANCEP: "Returns population covariance.",
  COVARIANCES: "Returns sample covariance.",
  CRITBINOM: "Returns the smallest value for which cumulative binomial ≥ criterion.",
  CSC: "Returns the cosecant of a number.",
  CSCH: "Returns the hyperbolic cosecant.",
  CUMIPMT: "Returns cumulative interest paid on a loan.",
  CUMPRINC: "Returns cumulative principal paid on a loan.",
  DATE: "Returns a date from year, month, and day.",
  DATEVALUE: "Converts text to a date serial number.",
  DAVERAGE: "Returns the average in a filtered list or database.",
  DAY: "Returns the day of the month.",
  DAYS: "Returns the number of days between two dates.",
  DAYS360: "Returns number of days between dates based on 360-day year.",
  DB: "Returns depreciation of an asset (fixed declining balance).",
  DCOUNT: "Counts numeric entries in a filtered list or database.",
  DCOUNTA: "Counts non-empty entries in a filtered list or database.",
  DDB: "Returns depreciation using double-declining balance.",
  DEC2BIN: "Converts a decimal number to binary.",
  DEC2HEX: "Converts a decimal number to hexadecimal.",
  DEC2OCT: "Converts a decimal number to octal.",
  DECIMAL: "Converts a text representation of a number in a given base.",
  DEGREES: "Converts radians to degrees.",
  DELTA: "Checks numerical equality (returns 1 or 0).",
  DEVSQ: "Returns sum of squares of deviations.",
  DGET: "Extracts a single value from a filtered database.",
  DISC: "Returns discount rate for a security.",
  DMAX: "Returns maximum in a filtered list or database.",
  DMIN: "Returns minimum in a filtered list or database.",
  DOLLAR: "Formats a number as currency text.",
  DOLLARDE: "Converts fractional dollar price to decimal.",
  DOLLARFR: "Converts decimal dollar price to fractional.",
  DPRODUCT: "Multiplies values in a filtered list or database.",
  DSTDEV: "Returns sample standard deviation in filtered data.",
  DSTDEVP: "Returns population standard deviation in filtered data.",
  DSUM: "Returns the sum of values in a filtered database.",
  DURATION: "Returns the duration of a security.",
  DVAR: "Returns variance of a filtered data sample.",
  DVARP: "Returns population variance of filtered data.",
  EDATE: "Returns a date shifted by a number of months.",
  EFFECT: "Returns the effective annual interest rate.",
  EOMONTH: "Returns the last day of a month offset by a number of months.",
  ERF: "Returns the error function.",
  ERFC: "Returns the complementary error function.",
  ERROR: "Returns an error message.",
  ERROR1: "Represents #NULL! error.",
  ERROR2: "Represents #DIV/0! error.",
  ERROR3: "Represents #VALUE! error.",
  ERROR4: "Represents #REF! error.",
  ERROR5: "Represents #NAME? error.",
  ERROR6: "Represents #NUM! error.",
  ERROR7: "Represents #N/A error.",
  EXP: "Returns e raised to a power.",
  EXPONDIST: "Returns exponential distribution.",
  FACT: "Returns factorial of a number.",
  FACTDOUBLE: "Returns double factorial.",
  FALSE: "Returns the logical value FALSE.",
  FDIST: "Returns the F probability distribution.",
  FDISTRT: "Returns the right-tailed F distribution.",
  FILTERXML: "Returns data from an XML string using an XPath query.",
  FIND: "Finds text within another text (case-sensitive).",
  FINDB: "Finds text within another text using byte count.",
  FISHER: "Returns Fisher transformation.",
  FISHERINV: "Returns inverse Fisher transformation.",
  FIXED: "Formats a number with fixed decimals.",
  FLOOR: "Rounds a number down to the nearest multiple.",
  FLOORMATH: "Rounds down using math rules.",
  FLOORPRECISE: "Rounds down to the nearest multiple.",
  FORECAST: "Returns predicted value using linear trend.",
  FREQUENCY: "Calculates frequency distribution.",
  FTEST: "Returns result of an F-test.",
  FV: "Returns future value of an investment.",
  FVSCHEDULE: "Returns future value with variable interest rates.",
  GAMMA: "Returns the gamma function value.",
  GAMMADIST: "Returns gamma distribution.",
  GAMMAINV: "Returns the inverse gamma distribution.",
  GAMMALN: "Returns the natural logarithm of the gamma function.",
  GAMMALNPRECISE: "Returns the precise natural log of the gamma function.",
  GAUSS: "Returns the Gauss error integral.",
  GCD: "Returns the greatest common divisor.",
  GEOMEAN: "Returns the geometric mean of numbers.",
  GESTEP: "Checks if a number is greater than or equal to a step.",
  GROWTH: "Calculates predicted exponential growth.",
  HARMEAN: "Returns the harmonic mean of numbers.",
  HEX2BIN: "Converts a hexadecimal number to binary.",
  HEX2DEC: "Converts a hexadecimal number to decimal.",
  HEX2OCT: "Converts a hexadecimal number to octal.",
  HLOOKUP: "Looks up a value horizontally in a table.",
  HOUR: "Returns the hour from a time value.",
  HYPERLINK: "Creates a hyperlink to a location.",
  HYPGEOMDIST: "Returns hypergeometric distribution.",
  IF: "Returns one value if a condition is TRUE, another if FALSE.",
  IMABS: "Returns absolute value of a complex number.",
  IMAGINARY: "Returns imaginary coefficient of a complex number.",
  IMARGUMENT: "Returns argument (theta) of a complex number.",
  IMCONJUGATE: "Returns the complex conjugate.",
  IMCOS: "Returns cosine of a complex number.",
  IMCOSH: "Returns hyperbolic cosine of a complex number.",
  IMCOT: "Returns cotangent of a complex number.",
  IMCSC: "Returns cosecant of a complex number.",
  IMDIV: "Divides two complex numbers.",
  IMEXP: "Returns exponential of a complex number.",
  IMLN: "Returns natural log of a complex number.",
  IMLOG10: "Returns base-10 logarithm of a complex number.",
  IMLOG2: "Returns base-2 logarithm of a complex number.",
  IMPOWER: "Raises a complex number to a power.",
  IMPRODUCT: "Multiplies complex numbers.",
  IMREAL: "Returns real part of a complex number.",
  IMSEC: "Returns secant of a complex number.",
  IMSECH: "Returns hyperbolic secant of a complex number.",
  IMSIN: "Returns sine of a complex number.",
  IMSINH: "Returns hyperbolic sine of a complex number.",
  IMSQRT: "Returns square root of a complex number.",
  IMSUB: "Subtracts complex numbers.",
  IMSUM: "Adds complex numbers.",
  INDEX: "Returns a value or reference from within a range.",
  INDIRECT: "Returns a reference specified by text.",
  INT: "Rounds a number down to the nearest integer.",
  INTERCEPT: "Returns the intercept of a regression line.",
  INTRATE: "Returns interest rate for a fully vested security.",
  IPMT: "Returns interest payment for a period of a loan.",
  IRR: "Returns internal rate of return for cash flows.",
  ISBLANK: "Checks whether a value is blank.",
  ISERR: "Checks for any error except #N/A.",
  ISERROR: "Checks whether a value is an error.",
  ISEVEN: "Checks if a number is even.",
  ISFORMULA: "Checks if a cell contains a formula.",
  ISLOGICAL: "Checks whether a value is TRUE or FALSE.",
  ISNA: "Checks whether a value is #N/A.",
  ISNONTEXT: "Checks whether a value is not text.",
  ISNUMBER: "Checks whether a value is a number.",
  ISODD: "Checks if a number is odd.",
  ISREF: "Checks whether a value is a reference.",
  ISTEXT: "Checks whether a value is text.",
  ISOCEILING: "Rounds a number up (ISO compliant).",
  ISOWEEKNUM: "Returns ISO compliant week number.",
  KURT: "Returns kurtosis of a data set.",
  LARGE: "Returns the k-th largest value.",
  LCM: "Returns least common multiple.",
  LEFT: "Returns the leftmost characters from text.",
  LEFTB: "Returns leftmost characters using byte count.",
  LEN: "Returns the length of a text string.",
  LENB: "Returns length of text using bytes.",
  LN: "Returns natural logarithm of a number.",
  LOG: "Returns logarithm of a number with custom base.",
  LOG10: "Returns base-10 logarithm.",
  LOGEST: "Returns exponential curve fit parameters.",
  LOGINV: "Returns inverse of lognormal distribution.",
  LOGNORMDIST: "Returns lognormal distribution.",
  LOGNORMINV: "Returns inverse lognormal distribution.",
  LOOKUP: "Looks up a value in a vector or array.",
  LOWER: "Converts text to lowercase.",
  MATCH: "Returns the position of a value in a list.",
  MAX: "Returns the largest value in a range.",
  MAXA: "Returns the largest value including logicals and text.",
  MAXIF: "Returns the maximum value that meets a condition.",
  MAXIFS: "Returns the maximum value that meets multiple conditions.",
  MDETERM: "Returns determinant of a matrix.",
  MDURATION: "Returns modified Macaulay duration.",
  MEDIAN: "Returns the median of a data set.",
  MID: "Returns characters from the middle of text.",
  MIDB: "Returns characters from text using byte count.",
  MIN: "Returns the smallest value in a range.",
  MINA: "Returns the smallest value including logicals and text.",
  MINIF: "Returns the minimum value that meets a condition.",
  MINIFS: "Returns the minimum value that meets multiple conditions.",
  MINUTE: "Returns the minute from a time value.",
  MIRR: "Returns modified internal rate of return.",
  MMULT: "Returns matrix product of two arrays.",
  MOD: "Returns the remainder after division.",
  MODE: "Returns the most frequent number in a range.",
  MODEMULT: "Returns multiple modes from a data set.",
  MONTH: "Returns the month from a date.",
  MROUND: "Rounds a number to the nearest multiple.",
  MULTINOMIAL: "Returns the multinomial coefficient.",
  N: "Converts a value to a number.",
  NA: "Returns the #N/A error.",
  NEGBINOMDIST: "Returns negative binomial distribution.",
  NETWORKDAYS: "Returns number of working days between two dates.",
  NOMINAL: "Returns nominal annual interest rate.",
  NORMDIST: "Returns normal distribution.",
  NORMINV: "Returns inverse normal distribution.",
  NORMSDIST: "Returns standard normal distribution.",
  NORMSINV: "Returns inverse standard normal distribution.",
  NOT: "Returns logical NOT of a value.",
  NOW: "Returns the current date and time.",
  NPER: "Returns number of periods for an investment.",
  NPV: "Returns net present value of cash flows.",
  OCT2BIN: "Converts octal to binary.",
  OCT2DEC: "Converts octal to decimal.",
  OCT2HEX: "Converts octal to hexadecimal.",
  ODD: "Rounds a number up to the nearest odd integer.",
  ODDFPRICE: "Returns price of a security with odd first period.",
  ODDFYIELD: "Returns yield of a security with odd first period.",
  ODDLPRICE: "Returns price of a security with odd last period.",
  ODDLYIELD: "Returns yield of a security with an odd last period.",
  OFFSET: "Returns a reference shifted from a starting point.",
  OR: "Returns TRUE if any argument is TRUE.",
  PDURATION: "Returns number of periods needed for investment growth.",
  PEARSON: "Returns the Pearson correlation coefficient.",
  PERCENTILE: "Returns the k-th percentile of a range.",
  PERCENTILEEXC: "Returns the percentile excluding endpoints.",
  PERCENTILEINC: "Returns the percentile including endpoints.",
  PERCENTRANK: "Returns rank of a value as a percentage.",
  PERCENTRANKEXC: "Returns percentage rank excluding endpoints.",
  PERCENTRANKINC: "Returns percentage rank including endpoints.",
  PERMUT: "Returns the number of permutations.",
  PERMUTATIONA: "Returns permutations with repetitions allowed.",
  PHI: "Returns value of the standard normal distribution function.",
  PI: "Returns the value of π.",
  PMT: "Returns payment amount for a loan.",
  POISSONDIST: "Returns Poisson distribution.",
  POWER: "Returns a number raised to a power.",
  PPMT: "Returns principal payment for a loan period.",
  PRICE: "Returns price of a security with periodic interest.",
  PRICEDISC: "Returns price of a discounted security.",
  PRICEMAT: "Returns price of a security at maturity.",
  PRODUCT: "Multiplies numbers together.",
  PROPER: "Capitalizes the first letter of each word.",
  PV: "Returns present value of an investment.",
  QUARTILE: "Returns the quartile of a data set.",
  QUARTILEEXC: "Returns the quartile excluding endpoints.",
  QUARTILEINC: "Returns the quartile including endpoints.",
  QUOTIENT: "Returns the integer portion of a division.",
  RADIANS: "Converts degrees to radians.",
  RAND: "Returns a random number between 0 and 1.",
  RANDBETWEEN: "Returns a random integer between two values.",
  RANK: "Returns rank of a number in a list.",
  RANKEQ: "Returns rank using the RANK.EQ method.",
  RANKAVG: "Returns rank using the RANK.AVG method.",
  RATE: "Returns interest rate per period.",
  RECEIVED: "Returns amount received at maturity for security.",
  REPLACE: "Replaces part of a text string.",
  REPLACEB: "Replaces text using byte positions.",
  REPT: "Repeats text a specified number of times.",
  RIGHT: "Returns the rightmost characters from text.",
  RIGHTB: "Returns rightmost characters using byte count.",
  ROMAN: "Converts a number to Roman numerals.",
  ROUND: "Rounds a number to a specified number of digits.",
  ROUNDDOWN: "Rounds a number down toward zero.",
  ROUNDUP: "Rounds a number up away from zero.",
  ROW: "Returns the row number of a reference.",
  ROWS: "Returns the number of rows in a range.",
  RSQ: "Returns the square of the Pearson correlation coefficient.",
  SEARCH: "Finds text within another text (case-insensitive).",
  SEARCHB: "Finds text using byte positions.",
  SEC: "Returns the secant of a number.",
  SECH: "Returns the hyperbolic secant.",
  SECOND: "Returns the seconds from a time value.",
  SERIESSUM: "Evaluates a power series.",
  SIGN: "Returns the sign of a number.",
  SIN: "Returns the sine of a number.",
  SINH: "Returns the hyperbolic sine.",
  SLN: "Returns straight-line depreciation.",
  SLOPE: "Returns slope of a regression line.",
  SMALL: "Returns the k-th smallest number.",
  SQRT: "Returns the square root of a number.",
  SQRTPI: "Returns the square root of (number × π).",
  STANDARDIZE: "Returns a normalized value.",
  STDEV: "Returns sample standard deviation.",
  STDEVA: "Returns standard deviation including text and logicals.",
  STDEVP: "Returns population standard deviation.",
  STDEVPA: "Returns population standard deviation including text.",
  STEYX: "Returns standard error of a regression.",
  SUBSTITUTE: "Replaces text occurrences with new text.",
  SUBTOTAL: "Returns subtotal for a list or database.",
  SUM: "Returns the sum of a range of numbers.",
  SUMIF: "Returns sum of values meeting a condition.",
  SUMIFS: "Returns sum of values meeting multiple conditions.",
  SUMPRODUCT: "Returns sum of products of arrays.",
  SUMSQ: "Returns sum of squares of numbers.",
  SUMX2MY2: "Returns sum of squared differences.",
  SUMX2PY2: "Returns sum of squared sums.",
  SUMXMY2: "Returns sum of squared deviations.",
  SYD: "Returns sum-of-years digits depreciation.",
  T: "Converts a value to text.",
  TAN: "Returns the tangent of a number.",
  TANH: "Returns the hyperbolic tangent.",
  TBILLEQ: "Returns bond equivalent yield for a Treasury bill.",
  TBILLPRICE: "Returns price per $100 face value for a Treasury bill.",
  TBILLYIELD: "Returns yield for a Treasury bill.",
  TEXT: "Formats a number using a format string.",
  TIME: "Returns a time value from hour, minute, and second.",
  TIMEVALUE: "Converts a text time to a serial number.",
  TINV: "Returns inverse t-distribution.",
  TODAY: "Returns the current date.",
  TRANSPOSE: "Returns the transpose of a range.",
  TREND: "Returns predicted linear trend values.",
  TRIM: "Removes leading and trailing spaces.",
  TRIMMEAN: "Returns mean excluding a percentage of top and bottom values.",
  TRUE: "Returns the logical value TRUE.",
  TRUNC: "Truncates a number to an integer.",
  TYPE: "Returns the type of a value.",
  UNICHAR: "Returns the Unicode character for a number.",
  UNICODE: "Returns the Unicode code point of a character.",
  UPPER: "Converts text to uppercase.",
  VALUE: "Converts text representing a number into a numeric value.",
  VAR: "Returns sample variance.",
  VARA: "Returns variance including text and logicals.",
  VARP: "Returns population variance.",
  VARPA: "Returns population variance including text.",
  VDB: "Returns depreciation using variable declining balance.",
  VLOOKUP: "Looks up a value vertically in a table.",
  WEEKDAY: "Returns the day of the week for a date.",
  WEEKNUM: "Returns the week number of a date.",
  WEIBULL: "Returns the Weibull distribution.",
  WORKDAY: "Returns a workday shifted by a number of days.",
  XIRR: "Returns internal rate of return for irregular cash flows.",
  XNPV: "Returns net present value for irregular cash flows.",
  XOR: "Returns logical exclusive OR.",
  YEAR: "Returns the year from a date.",
  YEARFRAC: "Returns the year fraction between two dates.",
  ZTEST: "Returns the one-tailed z-test probability."
};

// -------------------------------------------
// Auto-fallback description (short 1-liner)
// -------------------------------------------
function getDescription(fn) {
  return (
    FORMULA_DESCRIPTIONS[fn.toUpperCase()] ||
    `Returns the result of the ${fn} function.`
  );
}

// -------------------------------------------
// Auto example usage fallback
// -------------------------------------------
function getExampleUsage(fn) {
  const upper = fn.toUpperCase();

  const examples = {
    SUM: "=SUM(A1:A5)",
    AVERAGE: "=AVERAGE(B1:B10)",
    MIN: "=MIN(C1:C10)",
    MAX: "=MAX(C1:C10)",
    COUNT: "=COUNT(A1:A20)",
    IF: '=IF(A1>10, "YES", "NO")',
    ROUND: "=ROUND(A1, 2)",
    ABS: "=ABS(A1)",
    SQRT: "=SQRT(B3)",
    RAND: "=RAND()",
    RANDBETWEEN: "=RANDBETWEEN(1, 100)",
    CONCAT: '=CONCAT("Hello ", "World")',
    TEXT: '=TEXT(A1, "0.00")'
  };

  return examples[upper] || `=${upper}(value1, value2)`;
}

// -------------------------------------------
// PAGE COMPONENT
// -------------------------------------------
export default function FormulaDocsPage() {
  const functionNames = Object.keys(fjs).sort();
  const [search, setSearch] = useState("");

  const filtered = functionNames.filter((fn) =>
    fn.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold font-sans mb-6 text-gray-900">
        Formula Reference
      </h1>

      <p className="text-gray-600 mb-6">
        Browse all functions. Click any card to see a short description and example.
      </p>

      {/* Search */}
      <input
        type="text"
        placeholder="Search for a function…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-3 mb-6 text-lg border rounded shadow-sm focus:ring text-black"
      />

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((fn) => (
          <FormulaCard key={fn} name={fn} />
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------
// CARD COMPONENT
// -------------------------------------------
function FormulaCard({ name }) {
  const [open, setOpen] = useState(false);

  // Input field for user-provided argument(s)
  const [arg, setArg] = useState("2"); // default value for preview
  const [result, setResult] = useState("");

  const description = getDescription(name);

  // Run the formula in real time
  function evaluate() {
    try {
      const fn = fjs[name];

      // Split by comma and trim values → ["2", "34"]
      const parts = arg.split(",").map(v => v.trim());

      // Convert each to number if possible, otherwise keep as string
      const processedArgs = parts.map(v => {
        const n = Number(v);
        return isNaN(n) ? v : n;
      });

      // Spread arguments: fn(2, 34)
      const output = fn(...processedArgs);

      setResult(String(output));
    } catch (e) {
      setResult("Error");
    }
  }


  // Run function on input change
  useEffect(() => {
    evaluate();
  }, [arg]);

  return (
    <div
      className="p-5 bg-white shadow rounded-lg border hover:shadow-md transition cursor-pointer"
      onClick={() => setOpen(!open)}
    >
      <h2 className="text-xl font-bold text-blue-600 mb-2 flex justify-between">
        {name}
        <span>
  {open ? (
    <ChevronUp size={20} className="text-blue-600" />
  ) : (
    <ChevronDown size={20} className="text-blue-600" />
  )}
</span>

      </h2>

      {open && (
        <div className="mt-3">
          {/* Description */}
          <p className="text-gray-800 text-sm mb-3">
            <strong>Description:</strong> {description}
          </p>

          {/* Interactive Example */}
          <div className="mb-3">
            <strong className="text-sm text-gray-700">Try it:</strong>

            <div className="flex items-center mt-2 space-x-2">
              <span className="text-gray-700">={name}(</span>

              {/* Input field */}
              <input
                value={arg}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setArg(e.target.value)}
                className="border p-1 w-20 rounded text-sm text-black"
              />

              <span className="text-gray-700">)</span>
            </div>

            {/* Result */}
            <div className="mt-2 text-sm text-gray-700">
              <strong>= {result}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

