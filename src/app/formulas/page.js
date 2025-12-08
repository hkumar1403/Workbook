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
  ACCRINT: {
    overview:
      "Calculates the accrued interest for a security that pays periodic interest. Accrued interest represents the portion of the coupon payment earned between the last coupon date and the settlement date. This is used in bond markets when a bond is bought or sold between coupon payments.",
    usage:
      "ACCRINT(issue, first_interest, settlement, rate, par, frequency, [basis])",
    notes:
      "Use this function when trading coupon-bearing bonds to determine how much interest the buyer owes the seller. The 'basis' argument controls day-count convention, commonly 0 for US 30/360 or 1 for Actual/Actual.",
    example:
      '=ACCRINT("2024-01-01", "2024-07-01", "2024-04-01", 0.045, 1000, 2)'
  },
  ACCRINTM: {
    overview:
      "Returns the accrued interest for a security that pays interest only at maturity. This applies to zero-coupon bonds and deep-discount instruments where interest accumulates but is not paid until the end.",
    usage: "ACCRINTM(issue, settlement, rate, par, [basis])",
    notes:
      "Commonly used for Treasury bills and other short-term discount securities. Since there are no coupon dates, the interest accrues from issue to settlement.",
    example:
      '=ACCRINTM("2024-01-01", "2024-06-01", 0.05, 1000)'
  },
  ACOS: {
    overview:
      "Returns the arccosine (inverse cosine) of a value. Used in geometry, physics, and angle calculations.",
    usage: "ACOS(number)",
    notes:
      "Input must be between -1 and 1. Returns angle in radians.",
    example: "=ACOS(0.5)"
  },

  ACOSH: {
    overview:
      "Returns the inverse hyperbolic cosine of a number. Used in advanced engineering, mathematical analysis, and signal calculations.",
    usage: "ACOSH(number)",
    notes:
      "Input must be ≥ 1. Appears in certain wave and growth models.",
    example: "=ACOSH(2)"
  },

  ACOT: {
    overview:
      "Returns the arccotangent (inverse cotangent) of a number. Used in trigonometry and advanced mathematical modeling.",
    usage: "ACOT(number)",
    notes:
      "Returns result in radians. Complement of ATAN.",
    example: "=ACOT(1)"
  },

  ACOTH: {
    overview:
      "Returns the inverse hyperbolic cotangent of a number. Appears in advanced modeling of electrical circuits and hyperbolic systems.",
    usage: "ACOTH(number)",
    notes:
      "Valid for |number| > 1.",
    example: "=ACOTH(2)"
  },
  ADD: {
    overview:
      "Returns the sum of two numbers.",
    usage: "ADD(number1, number2)",
    notes:
      "Equivalent to number1 + number2. Use SUM for ranges of many values.",
    example: "=ADD(12, 30)"
  },
  AGGREGATE: {
    overview:
      "Applies a selected function (SUM, AVERAGE, MAX, etc.) to a range while optionally ignoring hidden rows, errors, or other conditions. Useful for filtered lists and robust analytics.",
    usage: "AGGREGATE(function_num, options, array, [k])",
    notes:
      "Function numbers 1–13 return single values; 14–19 require a second argument (k). Options determine which values are ignored.",
    example: "=AGGREGATE(9, 5, A1:A20)" // 9 = SUM, 5 = ignore hidden rows
  },
  AMORDEGRC: {
    overview:
      "Calculates depreciation for each accounting period using the French accounting system. It applies a variable depreciation coefficient based on asset lifetime, resulting in accelerated depreciation early in the asset's life.",
    usage: "AMORDEGRC(cost, purchase_date, first_period, salvage, period, rate, [basis])",
    notes:
      "Used primarily in European accounting standards. Produces a depreciation schedule with a faster write-off than straight-line methods.",
    example:
      '=AMORDEGRC(50000, "2024-01-01", "2024-12-31", 5000, 1, 0.12)'
  },

  AMORLINC: {
    overview:
      "Calculates linear depreciation for each accounting period using the French accounting system. Unlike AMORDEGRC, this applies a constant depreciation amount each period.",
    usage: "AMORLINC(cost, purchase_date, first_period, salvage, period, rate, [basis])",
    notes:
      "Useful when an asset must follow French linear depreciation rules, often for tax or regulatory compliance.",
    example:
      '=AMORLINC(30000, "2024-01-01", "2024-12-31", 3000, 1, 0.10)'
  },
  AND: "Returns TRUE if all arguments are TRUE.",
  ARABIC: {
    overview:
      "Converts Roman numerals to Arabic numbers. Useful when parsing text-based numeric systems.",
    usage: "ARABIC(text)",
    notes:
      "Supports Roman numerals up to 3999 (MMMCMXCIX).",
    example: '=ARABIC("MCMLXXX")'
  },
  ARGS2ARRAY: {
    overview:
      "Converts multiple arguments into a single array. Mostly used internally by Formula.js for normalization.",
    usage: "ARGS2ARRAY(arg1, arg2, ...)",
    notes:
      "Typically not used directly in spreadsheets; included for library completeness.",
    example: "=ARGS2ARRAY(1, 2, 3)"
  },
  ASC: {
    overview:
      "Converts full-width (double-byte) characters to half-width (single-byte) characters. Used in Japanese and other Asian text normalization.",
    usage: "ASC(text)",
    notes:
      "Useful for preparing structured data imported from legacy systems.",
    example: '=ASC("Ｈｅｌｌｏ")'
  },
  ASIN: {
    overview:
      "Returns the arcsine (inverse sine) of a value. Common in trigonometry, physics, modeling angles, and wave behaviors.",
    usage: "ASIN(number)",
    notes:
      "Input must be between −1 and 1. Output is in radians.",
    example: "=ASIN(0.5)"
  },
  ASINH: {
    overview:
      "Returns the inverse hyperbolic sine of a number. Appears in engineering, signal processing, and mathematical modeling.",
    usage: "ASINH(number)",
    notes:
      "Used in data transformations and modeling growth curves.",
    example: "=ASINH(2.5)"
  },
  ATAN: {
    overview:
      "Returns the arctangent (inverse tangent) of a number. Used to compute angles from slopes or ratios.",
    usage: "ATAN(number)",
    notes:
      "Returns radians. Use DEGREES() for conversion.",
    example: "=ATAN(1)"
  },
  ATAN2: {
    overview:
      "Returns the arctangent of x and y coordinates, determining the angle of a point relative to the origin. Used in geometry, navigation, and vector math.",
    usage: "ATAN2(x, y)",
    notes:
      "Unlike ATAN(y/x), ATAN2 handles correct quadrant placement.",
    example: "=ATAN2(3, 4)"
  },
  ATANH: {
    overview:
      "Returns the inverse hyperbolic tangent of a number. Used in engineering, probability theory, and statistical transforms.",
    usage: "ATANH(number)",
    notes:
      "Input must be between −1 and 1 (exclusive).",
    example: "=ATANH(0.8)"
  },
  AVEDEV: {
    overview:
      "Returns the average of absolute deviations from the mean. Useful in finance and statistics for measuring dispersion without squaring values.",
    usage: "AVEDEV(number1, number2, ...)",
    notes:
      "More robust to outliers than variance-based measures.",
    example: "=AVEDEV({10,12,14,100})"
  },
  AVERAGE: "Returns the average of numeric values.",
  AVERAGEA: {
    overview:
      "Returns the average of a dataset including text and logical values. TRUE counts as 1, FALSE as 0, and text counts as 0.",
    usage: "AVERAGEA(value1, value2, ...)",
    notes:
      "Use carefully—text can unintentionally skew results.",
    example: "=AVERAGEA({10, TRUE, \"text\", 20})"
  },
  AVERAGEIF: {
    overview:
      "Returns the average of numbers that meet a specified condition. Useful for conditional analytics in dashboards and reports.",
    usage: "AVERAGEIF(range, criteria, [average_range])",
    notes:
      "Supports logical operators and wildcards.",
    example: '=AVERAGEIF(A1:A10, ">50", B1:B10)'
  },
  AVERAGEIFS: {
    overview:
      "Returns the average of numbers that satisfy multiple conditions. Useful for multi-dimensional filtering such as region + category + metric.",
    usage: "AVERAGEIFS(average_range, criteria_range1, criteria1, ...)",
    notes:
      "More powerful than AVERAGEIF when many criteria are required.",
    example: '=AVERAGEIFS(C1:C100, A1:A100, "East", B1:B100, ">10000")'
  },
  BAHTTEXT: {
    overview:
      "Converts a number to Thai text representing currency (Baht). Used for formal financial documents in Thailand.",
    usage: "BAHTTEXT(number)",
    notes:
      "Language-specific; behaves similarly to TEXT-to-words converters.",
    example: "=BAHTTEXT(1250.75)"
  },
  BASE: {
    overview:
      "Converts a number into a text representation in a given base (radix). Useful for encoding, number systems, and digital computations.",
    usage: "BASE(number, radix, [min_length])",
    notes:
      "Supports bases between 2 and 36. Use min_length to left-pad the output.",
    example: "=BASE(255, 16, 4)" // returns "00FF"
  },
  BESSELI: {
    overview:
      "Computes the modified Bessel function of the first kind. This function appears in engineering, physics, and statistical theory, especially in problems involving cylindrical symmetry or diffusion.",
    usage: "BESSELI(x, n)",
    notes:
      "Often used in heat conduction, signal processing, and probability distributions such as the von Mises distribution.",
    example: "=BESSELI(2.5, 1)"
  },
  BESSELJ: {
    overview:
      "Returns the Bessel function of the first kind. This function frequently appears in wave propagation, oscillations, and solving differential equations in cylindrical coordinates.",
    usage: "BESSELJ(x, n)",
    notes:
      "Common in physics and engineering for modeling vibrations, electromagnetic waves, and structural resonance.",
    example: "=BESSELJ(3.2, 2)"
  },

  BESSELK: {
    overview:
      "Calculates the modified Bessel function of the second kind. It is often used in statistical distributions and physical models involving exponential decay and radial symmetry.",
    usage: "BESSELK(x, n)",
    notes:
      "Useful in probability, heat conduction modeling, and models involving dissipative processes.",
    example: "=BESSELK(2.0, 1)"
  },
  BESSELY: {
    overview:
      "Returns the Bessel function of the second kind. Used in engineering problems where solutions contain singularities and oscillatory behavior.",
    usage: "BESSELY(x, n)",
    notes:
      "Appears in solutions to differential equations in cylindrical coordinates, especially for boundary-conditioned wave equations.",
    example: "=BESSELY(4.5, 3)"
  },
  BETA: "Returns the beta function.",
  BETADIST: {
    overview:
      "Calculates the cumulative beta probability distribution, commonly used in Bayesian statistics, quality control, and modeling probabilities constrained between 0 and 1.",
    usage: "BETADIST(x, alpha, beta, [lower], [upper])",
    notes:
      "Useful for modeling proportions such as conversion rates, defect rates, and probabilities with natural bounds.",
    example: "=BETADIST(0.35, 4.2, 1.7)"
  },
  BETAINV: {
    overview:
      "Returns the inverse of the beta distribution. Given a probability, it finds the corresponding value of x on the beta distribution curve.",
    usage: "BETAINV(probability, alpha, beta, [lower], [upper])",
    notes:
      "Often used in Bayesian estimation and reliability modeling to determine percentile thresholds.",
    example: "=BETAINV(0.90, 3, 4)"
  },
  BIN2DEC: {
    overview:
      "Converts a binary number (base 2) to decimal. Useful in electronics, coding, digital logic, and bitwise operations.",
    usage: "BIN2DEC(number)",
    notes:
      "Accepts binary text strings. Returns signed values for 10-bit numbers (two's complement).",
    example: '=BIN2DEC("1011")'
  },
  BIN2HEX: {
    overview:
      "Converts a binary number to hexadecimal. Useful for memory addresses, digital encoding, and low-level computation.",
    usage: "BIN2HEX(number, [places])",
    notes:
      "Use places to pad the result with leading zeroes.",
    example: '=BIN2HEX("110111", 4)' // 37 in hex = "0025"
  },
  BIN2OCT: {
    overview:
      "Converts a binary number to octal. Useful for older systems, permissions, and compact numeric representation.",
    usage: "BIN2OCT(number, [places])",
    notes:
      "Supports optional zero-padding for uniform formatting.",
    example: '=BIN2OCT("101101")'
  },
  BINOM: {
    overview:
      "Returns the binomial coefficient (“n choose k”), representing the number of ways to choose k items from n without repetition. Useful in statistics and combinatorics.",
    usage: "BINOM(n, k)",
    notes:
      "Equivalent to COMBIN(n, k). Binomial coefficients grow rapidly for large n.",
    example: "=BINOM(10, 3)"
  },
  BINOMDIST: {
    overview:
      "Returns the probability of observing a certain number of successes in a fixed number of trials with a given probability. Used heavily in probability theory and statistical modeling.",
    usage: "BINOMDIST(x, trials, probability_s, cumulative)",
    notes:
      "Set cumulative=TRUE for cumulative probability P(X ≤ x).",
    example: "=BINOMDIST(4, 10, 0.3, TRUE)"
  },
  BITAND: {
    overview:
      "Returns the bitwise AND of two numbers. Useful in binary flag operations, permissions, and digital computation.",
    usage: "BITAND(number1, number2)",
    notes:
      "Operates on binary representations of integers.",
    example: "=BITAND(12, 10)" // 1100 AND 1010 = 1000 = 8
  },

  BITLSHIFT: {
    overview:
      "Returns a number shifted left by a specified number of bits. Used in bitwise encoding, data packing, and low-level computation.",
    usage: "BITLSHIFT(number, shift_amount)",
    notes:
      "Equivalent to multiplying by 2^shift_amount.",
    example: "=BITLSHIFT(5, 2)" // 5 << 2 = 20
  },
  BITOR: {
    overview:
      "Returns the bitwise OR of two integers. Useful for combining flags, masks, and encoded values.",
    usage: "BITOR(number1, number2)",
    notes:
      "Operates on each bit individually.",
    example: "=BITOR(12, 10)" // 1100 OR 1010 = 1110 = 14
  },
  BITRSHIFT: {
    overview:
      "Returns a number shifted right by a specified number of bits. Useful in unpacking encoded data, integer scaling, and low-level calculations.",
    usage: "BITRSHIFT(number, shift_amount)",
    notes:
      "Equivalent to integer division by 2^shift_amount.",
    example: "=BITRSHIFT(40, 3)" // 40 >> 3 = 5
  },
  BITXOR: {
    overview:
      "Returns the bitwise XOR of two numbers. Useful when toggling flags or detecting bit differences.",
    usage: "BITXOR(number1, number2)",
    notes:
      "XOR outputs 1 only when bits differ.",
    example: "=BITXOR(12, 10)" // 1100 XOR 1010 = 0110 = 6
  },
  CEILING: {
    overview:
      "Rounds a number up to the nearest multiple of a given significance. Useful for pricing, packaging, tax calculations, and rounding to required increments.",
    usage: "CEILING(number, significance)",
    notes:
      "For negative numbers, behavior differs by Excel version—CEILING.PRECISE is more consistent.",
    example: "=CEILING(47, 5)" // rounds to 50
  },

  CEILINGMATH: {
    overview:
      "Rounds a number up to the nearest integer or significance, with consistent handling of negative values. Useful for engineering and manufacturing.",
    usage: "CEILING.MATH(number, [significance], [mode])",
    notes:
      "Mode controls rounding direction for negative numbers.",
    example: "=CEILING.MATH(-47, 5)" // returns -45
  },
  CEILINGPRECISE: {
    overview:
      "Rounds a number up to the nearest integer or significance, always away from zero. Offers predictable behavior across positive and negative numbers.",
    usage: "CEILING.PRECISE(number, [significance])",
    notes:
      "Simpler and more consistent than CEILING for negative numbers.",
    example: "=CEILING.PRECISE(-47, 5)" // returns -45
  },
  CELL: {
    overview:
      "Returns information about a cell, such as its format, address, file name, or contents. Useful for dynamic reporting and metadata extraction.",
    usage: "CELL(info_type, [reference])",
    notes:
      "Common info types: \"address\", \"filename\", \"color\", \"width\".",
    example: "=CELL(\"address\", A10)"
  },
  CHAR: {
    overview:
      "Returns the character associated with a given ASCII code. Useful for inserting line breaks, symbols, and controlling text formatting.",
    usage: "CHAR(number)",
    notes:
      "CHAR(10) creates a line break on Windows. CHAR only works with ASCII; for Unicode use UNICHAR.",
    example: "=CHAR(65)" // "A"
  },
  CHIDIST: {
    overview:
      "Returns the left-tailed chi-square distribution, typically used in hypothesis testing, variance estimation, and goodness-of-fit tests.",
    usage: "CHIDIST(x, degrees_freedom)",
    notes:
      "Used to determine probabilities in chi-square tests such as testing categorical distributions.",
    example: "=CHIDIST(5.1, 4)"
  },
  CHIDISTRT: {
    overview:
      "Returns the right-tailed chi-square distribution. Used when the rejection region for a chi-square test is on the upper tail.",
    usage: "CHIDISTRT(x, degrees_freedom)",
    notes:
      "Useful for upper-tailed hypothesis tests such as variance exceeding expected values.",
    example: "=CHIDISTRT(10.4, 6)"
  },
  CHIINV: {
    overview:
      "Returns the inverse of the left-tailed chi-square distribution. Given a probability, returns the chi-square value that corresponds to it.",
    usage: "CHIINV(probability, degrees_freedom)",
    notes:
      "Used for determining critical chi-square values for statistical tests.",
    example: "=CHIINV(0.05, 8)"
  },
  CHIINVRT: {
    overview:
      "Returns the inverse of the right-tailed chi-square distribution. Useful when the rejection region is in the upper tail.",
    usage: "CHIINVRT(probability, degrees_freedom)",
    notes:
      "Used in high-variance hypothesis tests and upper-tail significance calculations.",
    example: "=CHIINVRT(0.025, 10)"
  },


  CHISQ: {
    overview:
      "Returns the chi-square distribution probability (left-tailed). Used for hypothesis testing and probability modeling.",
    usage: "CHISQ.DIST(x, degrees_freedom, cumulative)",
    notes:
      "cumulative=TRUE returns CDF; FALSE returns density.",
    example: "=CHISQ.DIST(5.5, 3, TRUE)"
  },
  CHITEST: {
    overview:
      "Returns the test statistic probability for a chi-square test. Used to compare observed vs expected frequency distributions.",
    usage: "CHITEST(actual_range, expected_range)",
    notes:
      "Low probability suggests significant deviation from expected values.",
    example: "=CHITEST({20,30,50},{25,25,50})"
  },
  CHOOSE: {
    overview:
      "Selects a value from a list based on an index number. Useful for scenario switching, dynamic ranges, and conditional value selection.",
    usage: "CHOOSE(index, value1, value2, ...)",
    notes:
      "Index must be between 1 and the number of options.",
    example: "=CHOOSE(2, \"Red\", \"Green\", \"Blue\")" // returns “Green”
  },
  CLEAN: {
    overview:
      "Removes non-printable control characters from text. Useful when cleaning imported data or web-scraped text.",
    usage: "CLEAN(text)",
    notes:
      "Does NOT remove non-breaking spaces; use TRIM + SUBSTITUTE for that.",
    example: '=CLEAN("Hello" & CHAR(7))'
  },

  CODE: {
    overview:
      "Returns the numeric code of the first character in a text string. Useful in encoding analysis, validation, and debugging text issues.",
    usage: "CODE(text)",
    notes:
      "Returns ASCII codes only. For Unicode, use UNICODE.",
    example: '=CODE("A")' // returns 65
  },

  COLUMN: {
    overview:
      "Returns the column number of a reference. Useful in dynamic formulas, array building, and indexing.",
    usage: "COLUMN([reference])",
    notes:
      "If no reference is provided, returns the column of the current cell.",
    example: "=COLUMN(C5)" // returns 3
  },
  COLUMNS: {
    overview:
      "Returns the count of columns in a range or array. Useful for table processing and dynamic formula creation.",
    usage: "COLUMNS(array)",
    notes:
      "Pairs well with ROWS and INDEX/OFFSET.",
    example: "=COLUMNS(A1:F1)" // returns 6
  },
  COMBIN: {
    overview:
      "Returns the number of combinations of n items taken k at a time (order does NOT matter). Common in probability and sampling.",
    usage: "COMBIN(n, k)",
    notes:
      "Equivalent to n! / (k!(n−k)!).",
    example: "=COMBIN(10, 3)"
  },
  COMBINA: {
    overview:
      "Returns the number of combinations with repetition allowed. Useful in combinatorial analysis with replacement.",
    usage: "COMBINA(n, k)",
    notes:
      "Computes (n + k − 1)! / (k!(n−1)!).",
    example: "=COMBINA(5, 3)" // choose 3 items from 5 with repetition
  },
  COMPLEX: {
    overview:
      "Converts real and imaginary components into a complex number in the form x + yi. Useful in electrical engineering, AC circuits, and advanced math.",
    usage: "COMPLEX(real_num, i_num, [suffix])",
    notes:
      "Suffix can be \"i\" or \"j\".",
    example: "=COMPLEX(3, 4)" // returns "3+4i"
  },
  CONCATENATE: {
    overview:
      "Joins multiple text strings into one. Useful for merging names, building IDs, formatting labels, or creating readable output.",
    usage: "CONCATENATE(text1, text2, ...)",
    notes:
      "Excel recommends TEXTJOIN or CONCAT for modern usage, but CONCATENATE is still widely supported.",
    example: '=CONCATENATE("Hello ", "World")'
  },
  CONFIDENCE: {
    overview:
      "Returns the confidence interval for a population mean. Used in statistics, polling, quality control, and estimation analysis.",
    usage: "CONFIDENCE(alpha, standard_dev, size)",
    notes:
      "Alpha is significance level (e.g., 0.05 for a 95% confidence interval).",
    example: "=CONFIDENCE(0.05, 10, 100)"
  },
  CONVERT: {
    overview:
      "Converts a number from one unit to another. Used in science, engineering, finance, and general calculations.",
    usage: "CONVERT(number, from_unit, to_unit)",
    notes:
      "Supports dozens of units (length, weight, temperature, pressure, etc.).",
    example: '=CONVERT(10, "km", "m")'
  },
  CORREL: {
    overview:
      "Returns the correlation coefficient between two datasets. Measures the strength of linear relationship between variables.",
    usage: "CORREL(array1, array2)",
    notes:
      "Correlation ranges from -1 to +1.",
    example: "=CORREL({10,20,30}, {15,25,35})"
  },
  COS: {
    overview:
      "Returns the cosine of an angle. Used in trigonometry, physics, geometry, and wave modeling.",
    usage: "COS(number)",
    notes:
      "Input must be in radians.",
    example: "=COS(RADIANS(60))"
  },

  COSH: {
    overview:
      "Returns the hyperbolic cosine of a number. Appears in engineering, heat transfer, and curve modeling.",
    usage: "COSH(number)",
    notes:
      "Useful for calculating shapes of hanging cables or hyperbolic curves.",
    example: "=COSH(1.5)"
  },

  COT: {
    overview:
      "Returns the cotangent of an angle. Used in advanced trigonometry and engineering mathematics.",
    usage: "COT(number)",
    notes:
      "Input must be in radians. Equivalent to 1 / TAN(x).",
    example: "=COT(RADIANS(45))"
  },
  COTH: {
    overview:
      "Returns the hyperbolic cotangent of a number. Appears in advanced mathematical modeling and differential equations.",
    usage: "COTH(number)",
    notes:
      "Used in hyperbolic-based models such as heat transfer and fluid mechanics.",
    example: "=COTH(2)"
  },
  COUNT: "Counts numeric values in a range.",
  COUNTA: "Counts non-empty values in a range.",
  COUNTBLANK: "Counts empty cells in a range.",
  COUNTIF: "Counts cells matching a condition.",
  COUNTIFS: "Counts cells matching multiple conditions.",
  COUNTIN: {
    overview:
      "Counts how many items from one range appear inside another range. Useful for membership testing and list comparisons.",
    usage: "COUNTIN(range, values)",
    notes:
      "Often used for checking overlaps between lists (e.g., matching IDs).",
    example: "=COUNTIN(A1:A10, C1:C3)"
  },
  COUNTUNIQUE: {
    overview:
      "Returns the number of unique values in a range. Useful in analytics, deduplication, and summary statistics.",
    usage: "COUNTUNIQUE(range)",
    notes:
      "Ignores duplicates; counts each unique value once.",
    example: "=COUNTUNIQUE({1,1,2,3,3,3})"
  },
  COUPDAYBS: {
    overview:
      "Returns the number of days from the beginning of a coupon period until the settlement date. Used in bond pricing and accrued interest calculations.",
    usage:
      "COUPDAYBS(settlement, maturity, frequency, [basis])",
    notes:
      "Used mainly for fixed-income securities with periodic coupon payments.",
    example:
      '=COUPDAYBS("2024-04-01", "2030-04-01", 2)'
  },
  COUPDAYS: {
    overview:
      "Returns the number of days in the current coupon period for a security. Useful in fixed-income accrual calculations.",
    usage:
      "COUPDAYS(settlement, maturity, frequency, [basis])",
    notes:
      "Frequency indicates number of coupons per year (1, 2, or 4).",
    example:
      '=COUPDAYS("2024-04-01", "2030-04-01", 2)'
  },
  COUPDAYSNC: {
    overview:
      "Returns the number of days from the settlement date to the next coupon date. Used to compute accrued interest before coupon payment.",
    usage:
      "COUPDAYSNC(settlement, maturity, frequency, [basis])",
    notes:
      "Used in bond valuation and settlement calculations.",
    example:
      '=COUPDAYSNC("2024-04-01", "2030-04-01", 2)'
  },
  COUPNCD: {
    overview:
      "Returns the next coupon date after the settlement date. Critical for bond pricing schedules and cashflow modeling.",
    usage:
      "COUPNCD(settlement, maturity, frequency, [basis])",
    notes:
      "Typically used to determine cashflow timing.",
    example:
      '=COUPNCD("2024-04-01", "2030-04-01", 2)'
  },
  COUPNUM: {
    overview:
      "Returns the number of remaining coupon periods until maturity. Useful for bond lifetime analysis.",
    usage:
      "COUPNUM(settlement, maturity, frequency, [basis])",
    notes:
      "Frequency determines number of coupons per year.",
    example:
      '=COUPNUM("2024-04-01", "2030-04-01", 2)'
  },
  COUPPCD: {
    overview:
      "Returns the previous coupon date before the settlement date. Used heavily in bond accrual and pricing calculations to anchor coupon periods.",
    usage:
      "COUPPCD(settlement, maturity, frequency, [basis])",
    notes:
      "Frequency indicates coupons per year (1, 2, or 4). Helps determine accrued interest windows.",
    example:
      '=COUPPCD("2024-04-01", "2030-04-01", 2)'
  },
  COVAR: {
    overview:
      "Returns the covariance between two datasets using the traditional (sample) method. Measures how two variables move together.",
    usage: "COVAR(array1, array2)",
    notes:
      "Positive covariance = move together; negative = move inversely.",
    example: "=COVAR({2,4,6}, {3,8,11})"
  },
  COVARIANCE: {
    overview:
      "Returns the covariance using Excel’s population method. Measures joint variability across an entire dataset.",
    usage: "COVARIANCE.P(array1, array2)",
    notes:
      "Divides by N instead of N−1. Use when data represents full population.",
    example: "=COVARIANCE.P({2,4,6}, {3,8,11})"
  },
  COVARIANCEP: {
    overview:
      "Alias for the population covariance function. Equivalent to COVARIANCE.P.",
    usage: "COVARIANCE.P(array1, array2)",
    notes:
      "Included for backward compatibility in libraries.",
    example: "=COVARIANCE.P({2,4,6}, {3,8,11})"
  },
  COVARIANCES: {
    overview:
      "Returns the sample covariance (dividing by N−1). Equivalent to COVARIANCE.S.",
    usage: "COVARIANCE.S(array1, array2)",
    notes:
      "Used when data is a sample, not entire population.",
    example: "=COVARIANCE.S({2,4,6}, {3,8,11})"
  },
  CRITBINOM: {
    overview:
      "Returns the smallest value x for which the cumulative binomial distribution is greater than or equal to a given threshold probability.",
    usage: "CRITBINOM(trials, probability_s, alpha)",
    notes:
      "Useful in statistical quality control and probability thresholding.",
    example: "=CRITBINOM(20, 0.3, 0.9)"
  },
  CSC: {
    overview:
      "Returns the cosecant of an angle (1/sin). Useful in trigonometry and engineering calculations involving waveforms.",
    usage: "CSC(number)",
    notes:
      "Input must be in radians.",
    example: "=CSC(RADIANS(45))"
  },
  CSCH: {
    overview:
      "Returns the hyperbolic cosecant of a number. Appears in advanced mathematics, signal processing, and engineering.",
    usage: "CSCH(number)",
    notes:
      "Useful in hyperbolic function modeling.",
    example: "=CSCH(2)"
  },
  CUMIPMT: {
    overview:
      "Returns the cumulative interest paid between two periods for a loan. Used in amortization schedules and loan analysis.",
    usage:
      "CUMIPMT(rate, nper, pv, start_period, end_period, type)",
    notes:
      "type = 0 → payments at end; type = 1 → payments at beginning.",
    example: "=CUMIPMT(0.05/12, 60, 20000, 1, 12, 0)"
  },
  CUMPRINC: {
    overview:
      "Returns the cumulative principal paid between two periods. Useful for showing how much of a loan balance is reduced over time.",
    usage:
      "CUMPRINC(rate, nper, pv, start_period, end_period, type)",
    notes:
      "Complements CUMIPMT to split payments into interest and principal.",
    example: "=CUMPRINC(0.05/12, 60, 20000, 1, 12, 0)"
  },
  DATE: {
    overview:
      "Creates a date value from year, month, and day components. Automatically handles overflow—e.g., month 13 becomes next year.",
    usage: "DATE(year, month, day)",
    notes:
      "Reliable for constructing dates programmatically.",
    example: "=DATE(2024, 5, 15)"
  },
  DATEVALUE: {
    overview:
      "Converts a text-formatted date into a valid date serial number. Useful for cleaning imported datasets.",
    usage: "DATEVALUE(date_text)",
    notes:
      "Works with most locale formats; depends on system settings.",
    example: '=DATEVALUE("2024-10-12")'
  },

  DAVERAGE: {
    overview:
      "Returns the average of records in a database (table) that meet a given condition. Useful for structured datasets with headers.",
    usage: "DAVERAGE(database, field, criteria)",
    notes:
      "Field can be a column label or column index.",
    example:
      '=DAVERAGE(A1:D100, "Sales", F1:G2)' // criteria table required
  },
  DAY: {
    overview:
      "Extracts the day of the month from a date (1–31). Useful in time-based calculations and parsing.",
    usage: "DAY(date)",
    notes:
      "Works on valid date serial numbers or text dates.",
    example: '=DAY("2024-07-25")'
  },
  DAYS: {
    overview:
      "Returns the number of days between two dates. Useful for durations, deadlines, and time calculations.",
    usage: "DAYS(end_date, start_date)",
    notes:
      "Equivalent to end_date − start_date.",
    example: '=DAYS("2024-12-31", "2024-01-01")'
  },
  DAYS360: {
    overview:
      "Calculates the number of days between two dates based on a 360-day year (12 months × 30 days). Used in accounting, bonds, and financial interest calculations.",
    usage: "DAYS360(start_date, end_date, [method])",
    notes:
      "method=TRUE uses European 30/360 rules; FALSE uses U.S. rules.",
    example: '=DAYS360("2024-01-01", "2024-04-01")'
  },
  DB: {
    overview:
      "Returns depreciation using the fixed-declining balance method. Used in asset depreciation schedules.",
    usage: "DB(cost, salvage, life, period, [month])",
    notes:
      "Accelerates depreciation early in the asset life.",
    example: "=DB(50000, 5000, 10, 1)"
  },
  DCOUNT: {
    overview:
      "Counts numeric entries in a database (table) that meet criteria. Used for filtered aggregations in structured tables.",
    usage: "DCOUNT(database, field, criteria)",
    notes:
      "Field can be index or column name. Criteria table required.",
    example:
      '=DCOUNT(A1:D100, "Amount", F1:G2)'
  },
  DCOUNTA: {
    overview:
      "Counts non-empty entries in a database that match criteria. Counts text and numbers.",
    usage: "DCOUNTA(database, field, criteria)",
    notes:
      "Useful when analyzing datasets with mixed value types.",
    example:
      '=DCOUNTA(A1:D100, "Name", F1:G2)'
  },
  DDB: "Returns depreciation using double-declining balance.",
  DEC2BIN: "Converts a decimal number to binary.",
  DEC2HEX: "Converts a decimal number to hexadecimal.",
  DEC2OCT: "Converts a decimal number to octal.",
  DECIMAL: "Converts a text representation of a number in a given base.",
  DEGREES: "Converts radians to degrees.",
  DELTA: "Checks numerical equality (returns 1 or 0).",
  DEVSQ: "Returns sum of squares of deviations.",
  DGET: {
    overview:
      "Extracts a single value from a database column that matches criteria. If more than one record matches, it returns an error.",
    usage: "DGET(database, field, criteria)",
    notes:
      "Useful when criteria uniquely identify one row.",
    example:
      '=DGET(A1:D100, "Price", F1:G2)'
  },
  DISC: "Returns discount rate for a security.",
  DMAX: {
    overview:
      "Returns the maximum value in a database column that meets criteria. Useful for filtered analytics and condition-based maximums.",
    usage: "DMAX(database, field, criteria)",
    notes:
      "Criteria table determines which rows are included.",
    example:
      '=DMAX(A1:D100, "Sales", F1:G2)'
  },
  DMIN: {
    overview:
      "Returns the minimum value in a database column based on given criteria.",
    usage: "DMIN(database, field, criteria)",
    notes:
      "Useful for finding lowest filtered values in structured datasets.",
    example:
      '=DMIN(A1:D100, "Sales", F1:G2)'
  },
  DOLLAR: "Formats a number as currency text.",
  DOLLARDE: "Converts fractional dollar price to decimal.",
  DOLLARFR: "Converts decimal dollar price to fractional.",
  DPRODUCT: {
    overview:
      "Returns the product of values in a database column for records that meet criteria. Useful in financial or multiplicative calculations.",
    usage: "DPRODUCT(database, field, criteria)",
    notes:
      "Less common but powerful for compound measurements.",
    example:
      '=DPRODUCT(A1:D100, "Units", F1:G2)'
  },
  DSTDEV: {
    overview:
      "Calculates sample standard deviation for filtered records in a database.",
    usage: "DSTDEV(database, field, criteria)",
    notes:
      "Uses sample formula (n − 1).",
    example:
      '=DSTDEV(A1:D100, "Score", F1:G2)'
  },

  DSTDEVP: {
    overview:
      "Calculates population standard deviation for filtered records.",
    usage: "DSTDEVP(database, field, criteria)",
    notes:
      "Use when the dataset represents the full population.",
    example:
      '=DSTDEVP(A1:D100, "Score", F1:G2)'
  },
  DSUM: {
    overview:
      "Sums values in a database column that meet criteria. Useful for structured, filtered aggregations.",
    usage: "DSUM(database, field, criteria)",
    notes:
      "Criteria table determines which rows are included.",
    example:
      '=DSUM(A1:D100, "Sales", F1:G2)'
  },
  DURATION: "Returns the duration of a security.",
  DVAR: {
    overview:
      "Calculates sample variance of filtered database records.",
    usage: "DVAR(database, field, criteria)",
    notes:
      "Uses sample formula dividing by n − 1.",
    example:
      '=DVAR(A1:D100, "Score", F1:G2)'
  },

  DVARP: {
    overview:
      "Calculates population variance of filtered database records.",
    usage: "DVARP(database, field, criteria)",
    notes:
      "Use for full-population datasets.",
    example:
      '=DVARP(A1:D100, "Score", F1:G2)'
  },
  EDATE: {
    overview:
      "Returns the date a given number of months before or after a start date. Useful for billing, forecasting, and date offsets.",
    usage: "EDATE(start_date, months)",
    notes:
      "Handles month overflow correctly.",
    example: "=EDATE(\"2024-01-15\", 3)" // → 2024-04-15
  },
  EFFECT: {
    overview:
      "Returns the effective annual interest rate given a nominal rate and compounding periods. Useful in comparing financial products with different compounding assumptions.",
    usage: "EFFECT(nominal_rate, npery)",
    notes:
      "npery = number of compounding periods per year (e.g., 12 for monthly).",
    example: "=EFFECT(0.12, 12)" // Effective rate > 12%
  },
  EOMONTH: {
    overview:
      "Returns the last day of the month, offset by a number of months from a date. Useful for financial calendars, billing cycles, and period-end calculations.",
    usage: "EOMONTH(start_date, months)",
    notes:
      "months can be negative (previous months) or positive.",
    example: "=EOMONTH(\"2024-01-15\", 1)" // → 2024-02-29 (leap year!)
  },
  ERF: {
    overview:
      "Returns the error function, a key component in probability, statistics, and diffusion models.",
    usage: "ERF(lower_limit, [upper_limit])",
    notes:
      "If only one argument is provided, lower limit is 0.",
    example: "=ERF(0, 1)"
  },
  ERFC: {
    overview:
      "Returns the complementary error function (1 − ERF). Useful in statistical tail probability calculations.",
    usage: "ERFC(x)",
    notes:
      "Often used in normal distribution approximations.",
    example: "=ERFC(1)"
  },
  ERROR: "Returns an error message.",
  ERROR1: "Represents #NULL! error.",
  ERROR2: "Represents #DIV/0! error.",
  ERROR3: "Represents #VALUE! error.",
  ERROR4: "Represents #REF! error.",
  ERROR5: "Represents #NAME? error.",
  ERROR6: "Represents #NUM! error.",
  ERROR7: "Represents #N/A error.",
  EVEN: {
    overview:
      "Rounds a number up to the nearest even integer. Useful in engineering constraints and batch processing.",
    usage: "EVEN(number)",
    notes:
      "Rounds away from zero.",
    example: "=EVEN(7.1)" // returns 8
  },
  EXACT: {
    overview:
      "Checks if two text strings are exactly the same, including case sensitivity. Useful for strict matching.",
    usage: "EXACT(text1, text2)",
    notes:
      "Returns TRUE/FALSE.",
    example: '=EXACT("Hello", "hello")' // FALSE
  },
  EXP: {
    overview:
      "Returns e (≈2.71828) raised to a given power. Used in exponential growth models, finance, biology, and physics.",
    usage: "EXP(number)",
    notes:
      "Inverse of LN().",
    example: "=EXP(1)" // e
  },
  EXPONDIST: {
    overview:
      "Returns the exponential distribution. Used for modeling time between events (failures, arrivals, Poisson processes).",
    usage: "EXPON.DIST(x, lambda, cumulative)",
    notes:
      "λ must be > 0. Exponential distribution assumes constant hazard rate.",
    example: "=EXPON.DIST(2, 0.5, TRUE)"
  },

  FACT: {
    overview:
      "Returns the factorial of a number (n!). Used in probability, permutations, and combinatorics.",
    usage: "FACT(number)",
    notes:
      "Grows extremely fast; FACT(20) is already 2.43e18.",
    example: "=FACT(6)" // 720
  },
  FACTDOUBLE: {
    overview:
      "Returns the double factorial (n!!). Useful in combinatorics, spherical harmonics, integrals, and counting problems.",
    usage: "FACTDOUBLE(number)",
    notes:
      "Even numbers: n!! = n × (n−2) × ...; odd numbers similar.",
    example: "=FACTDOUBLE(7)" // 7×5×3×1
  },
  FALSE: {
    overview:
      "Returns logical FALSE. Used in conditional formulas and boolean logic.",
    usage: "FALSE()",
    notes:
      "Equivalent to simply typing FALSE.",
    example: "=FALSE()"
  },
  FDIST: {
    overview:
      "Returns the F-distribution probability. Used in ANOVA, variance testing, and regression analysis.",
    usage: "F.DIST(x, degrees_freedom1, degrees_freedom2, cumulative)",
    notes:
      "Large F-values imply significant variance differences.",
    example: "=F.DIST(4.5, 3, 20, TRUE)"
  },
  FDISTRT: "Returns the right-tailed F distribution.",
  FILTERXML: "Returns data from an XML string using an XPath query.",

  FIND: {
    overview:
      "Returns the position of a substring within text, case-sensitive. Useful for parsing, validation, and extraction.",
    usage: "FIND(find_text, within_text, [start_num])",
    notes:
      "Unlike SEARCH, FIND does not support wildcards.",
    example: '=FIND("cat", "Concatenate")' // returns 4
  },
  FINDB: {
    overview:
      "Byte-based version of FIND for DBCS languages (Japanese, Chinese, Korean). Counts bytes instead of characters.",
    usage: "FINDB(find_text, within_text, [start_byte])",
    notes:
      "Use only in multi-byte character environments.",
    example: '=FINDB("テ", "テスト")'
  },
  FISHER: {
    overview:
      "Returns the Fisher transformation of a number. Useful in statistics to stabilize variance when analyzing correlation coefficients.",
    usage: "FISHER(x)",
    notes:
      "Input must be between −1 and 1 (exclusive).",
    example: "=FISHER(0.8)"
  },
  FISHERINV: {
    overview:
      "Returns the inverse of the Fisher transformation. Converts z-values back to correlation coefficients.",
    usage: "FISHERINV(z)",
    notes:
      "Inverse of FISHER().",
    example: "=FISHERINV(1.0986)"
  },
  FIXED: {
    overview:
      "Rounds a number to a fixed number of decimal places and returns the result as text. Useful for formatting currency or reports.",
    usage: "FIXED(number, [decimals], [no_commas])",
    notes:
      "Set no_commas=TRUE to remove separators.",
    example: "=FIXED(12345.678, 2)"
  },
  FLOOR: {
    overview:
      "Rounds a number down to the nearest multiple of a significance value. Useful for pricing and batch-sizing.",
    usage: "FLOOR(number, significance)",
    notes:
      "Opposite of CEILING.",
    example: "=FLOOR(47, 5)" // returns 45
  },

  FLOORMATH: "Rounds down using math rules.",
  FLOORPRECISE: "Rounds down to the nearest multiple.",
  FMOD: {
    overview:
      "Returns the floating-point remainder of number ÷ divisor. Useful for precise modular arithmetic.",
    usage: "FMOD(number, divisor)",
    notes:
      "Unlike MOD, handles floating-point numbers precisely.",
    example: "=FMOD(5.7, 2)" // 1.7
  },

  FORECAST: {
    overview:
      "Predicts a future value along a linear trend. Used in forecasting sales, expenses, performance metrics, and time-series projections.",
    usage: "FORECAST(x, known_y, known_x)",
    notes:
      "Equivalent to TREND for a single value.",
    example: "=FORECAST(6, {10,20,30}, {1,2,3})"
  },
  FREQUENCY: "Calculates frequency distribution.",

  FTEST: {
    overview:
      "Returns the F-test probability between two datasets. Used to compare variances in statistical analysis.",
    usage: "FTEST(array1, array2)",
    notes:
      "Small values indicate statistically significant difference in variances.",
    example: "=FTEST({5,6,7}, {10,12,11})"
  },
  FV: "Returns future value of an investment.",
  FVSCHEDULE: "Returns future value with variable interest rates.",
  GAMMA: {
    overview:
      "Returns the Gamma function value for a number. Generalizes factorial to real numbers.",
    usage: "GAMMA(number)",
    notes:
      "GAMMA(n) = (n−1)! for integers.",
    example: "=GAMMA(5.5)"
  },

  GAMMADIST: {
    overview:
      "Calculates the gamma probability distribution. Useful for modeling waiting times, queueing systems, reliability analysis, and processes where events occur continuously and independently.",
    usage: "GAMMADIST(x, alpha, beta, cumulative)",
    notes:
      "A very flexible distribution used in insurance modeling, failure rates, and Bayesian statistics.",
    example: "=GAMMADIST(3, 2, 1, TRUE)"
  },
  GAMMAINV: {
    overview:
      "Returns the inverse of the gamma cumulative distribution. Given a probability, it finds the value of x for which the gamma distribution reaches that probability. Useful in queuing theory, survival analysis, and risk modeling.",
    usage: "GAMMAINV(probability, alpha, beta)",
    notes:
      "Use GAMMAINV for modeling time-to-failure scenarios, insurance risk layers, and stochastic simulation.",
    example: "=GAMMAINV(0.90, 3, 2)"
  },
  GAMMALN: {
    overview:
      "Returns the natural logarithm of the gamma function. This is useful in probability and statistics when dealing with large factorials or likelihood models.",
    usage: "GAMMALN(x)",
    notes:
      "The gamma function generalizes factorials to non-integers. GAMMALN avoids overflow when x is large.",
    example: "=GAMMALN(5.2)"
  },
  GAMMALNPRECISE: {
    overview:
      "Provides the precise natural logarithm of the gamma function. This function improves numerical stability for statistical computations.",
    usage: "GAMMALNPRECISE(x)",
    notes:
      "Used in logistic regression, Bayesian inference, and maximum likelihood estimation for computational precision.",
    example: "=GAMMALNPRECISE(7.1)"
  },
  GAUSS: {
    overview:
      "Returns the standard normal cumulative distribution from –∞ to x. It is commonly used to compute probabilities in standard normal statistics.",
    usage: "GAUSS(x)",
    notes:
      "GAUSS(x) is equivalent to NORMSDIST(x) minus 0.5 and is useful for symmetry-based probability calculations.",
    example: "=GAUSS(1.5)"
  },
  GCD: {
    overview:
      "Returns the greatest common divisor of one or more integers. Useful in number theory, ratios, fractions, and problem-solving.",
    usage: "GCD(number1, number2, ...)",
    notes:
      "All numbers must be integers.",
    example: "=GCD(24, 60)"
  },
  GEOMEAN: "Returns the geometric mean of numbers.",

  GESTEP: {
    overview:
      "Returns 1 if number ≥ step; otherwise returns 0. Useful for thresholding, condition testing, and piecewise functions.",
    usage: "GESTEP(number, [step])",
    notes:
      "Default step = 0.",
    example: "=GESTEP(5, 3)" // returns 1
  },
  GROWTH: {
    overview:
      "Calculates predicted exponential growth based on known x- and y-values. Often used for forecasting, financial projections, and population growth modeling.",
    usage: "GROWTH(known_y, known_x, new_x, [const])",
    notes:
      "Useful for datasets that follow exponential trends rather than linear ones.",
    example: "=GROWTH({5, 7, 12}, {1, 2, 3}, 4)"
  },
  HARMEAN: {
    overview:
      "Returns the harmonic mean of a dataset. Useful when averaging rates, ratios, or speeds, where smaller values should have greater influence.",
    usage: "HARMEAN(number1, number2, ...)",
    notes:
      "Commonly used in finance (P/E ratios), physics (harmonic oscillators), and travel speed averaging.",
    example: "=HARMEAN(4, 6, 9)"
  },
  HEX2BIN: {
    overview:
      "Converts a hexadecimal number to binary. Used in programming, networking, and digital systems.",
    usage: "HEX2BIN(number, [places])",
    notes:
      "If places is provided, output is padded with leading zeros.",
    example: '=HEX2BIN("1F", 8)' // "00011111"
  },

  HEX2DEC: {
    overview:
      "Converts a hexadecimal value to decimal. Useful in computing, color codes, and low-level data operations.",
    usage: "HEX2DEC(number)",
    notes:
      "Valid for hex values from FFFFFFFF to 7FFFFFFF (signed 40-bit range).",
    example: '=HEX2DEC("FF")' // 255
  },
  HEX2OCT: {
    overview:
      "Converts a hexadecimal number to octal. Useful in older computing systems and compact numeric notation.",
    usage: "HEX2OCT(number, [places])",
    notes:
      "Supports optional zero-padding.",
    example: '=HEX2OCT("3F")'
  },
  HLOOKUP: "Looks up a value horizontally in a table.",
  HOUR: {
    overview:
      "Extracts the hour component (0–23) from a time value. Useful in time logs, scheduling, and analytics.",
    usage: "HOUR(time)",
    notes:
      "Works with text-formatted times and serial numbers.",
    example: '=HOUR("18:45:00")' // 18
  },

  HYPERLINK: {
    overview:
      "Creates a clickable hyperlink. Useful for navigation, reports, external references, and file links.",
    usage: "HYPERLINK(link_location, [friendly_name])",
    notes:
      "Can link to documents, websites, or workbook locations.",
    example: '=HYPERLINK("https://google.com", "Search Google")'
  },
  HYPGEOMDIST: {
    overview:
      "Returns the hypergeometric distribution. Models the probability of selecting a given number of successes in a sample drawn without replacement.",
    usage: "HYPGEOMDIST(sample_successes, sample_size, population_successes, population_size)",
    notes:
      "Useful in quality control, card games, and discrete sampling situations without replacement.",
    example: "=HYPGEOMDIST(2, 5, 10, 50)"
  },
  IF: "Returns one value if a condition is TRUE, another if FALSE.",
  IMABS: {
    overview:
      "Returns the absolute value (modulus) of a complex number. Used in electrical engineering, phasor magnitude, and vector length.",
    usage: "IMABS(inumber)",
    notes:
      "|a + bi| = √(a² + b²).",
    example: '=IMABS("3+4i")' // 5
  },

  IMAGINARY: {
    overview:
      "Returns the imaginary coefficient of a complex number. Useful for AC circuits, phasor math, and imaginary component extraction.",
    usage: "IMAGINARY(inumber)",
    notes:
      "Accepts text forms like \"3+4i\".",
    example: '=IMAGINARY("5-7i")' // -7
  },
  IMARGUMENT: {
    overview:
      "Returns the phase angle (argument) of a complex number in radians. Used in signal processing, AC power, and polar conversion.",
    usage: "IMARGUMENT(inumber)",
    notes:
      "Angle measured from positive x-axis.",
    example: '=IMARGUMENT("3+3i")'
  },
  IMCONJUGATE: {
    overview:
      "Returns the complex conjugate of a complex number: a + bi becomes a − bi. Useful for simplifying complex arithmetic.",
    usage: "IMCONJUGATE(inumber)",
    notes:
      "Critical in forming magnitudes and rationalizing denominators.",
    example: '=IMCONJUGATE("4+5i")' // "4-5i"
  },
  IMCOS: {
    overview:
      "Returns the cosine of a complex number. Used in advanced math, wave modeling, and engineering.",
    usage: "IMCOS(inumber)",
    notes:
      "Supports complex angles a + bi.",
    example: '=IMCOS("2+i")'
  },
  IMCOSH: {
    overview:
      "Returns the hyperbolic cosine of a complex number. Used in physics, signal propagation, and complex transformations.",
    usage: "IMCOSH(inumber)",
    notes:
      "Part of the complex hyperbolic function family.",
    example: '=IMCOSH("1+2i")'
  },
  IMCOT: {
    overview:
      "Returns the cotangent of a complex number. Appears in advanced engineering and mathematical modeling.",
    usage: "IMCOT(inumber)",
    notes:
      "Equivalent to 1 / IMTAN(z).",
    example: '=IMCOT("2+i")'
  },
  IMCSC: {
    overview:
      "Returns the cosecant of a complex number. Useful for wave, signal, and electrical modeling.",
    usage: "IMCSC(inumber)",
    notes:
      "Reciprocal of IMSIN().",
    example: '=IMCSC("1+i")'
  },
  IMCSCH: {
    overview:
      "Returns the hyperbolic cosecant of a complex number. Appears in advanced engineering, electromagnetics, and hyperbolic system modeling.",
    usage: "IMCSCH(inumber)",
    notes:
      "Hyperbolic reciprocal of IMSINH().",
    example: '=IMCSCH("1+2i")'
  },
  IMDIV: {
    overview:
      "Divides one complex number by another. Useful in electrical engineering, circuit analysis, and signal processing.",
    usage: "IMDIV(inumber1, inumber2)",
    notes:
      "Complex division expresses results in a+bi format, helpful when analyzing impedance or AC signals.",
    example: '=IMDIV("4+3i", "1-2i")'
  },
  IMEXP: {
    overview:
      "Returns the exponential of a complex number. Widely used in wave propagation, differential equations, and Fourier analysis.",
    usage: "IMEXP(inumber)",
    notes:
      "Complex exponentials often represent oscillating signals like sine waves in engineering applications.",
    example: '=IMEXP("2+i")'
  },
  IMLN: {
    overview:
      "Returns the natural logarithm of a complex number. Used for converting to polar form (log magnitude + i·angle).",
    usage: "IMLN(inumber)",
    notes:
      "Equivalent to ln|z| + i·arg(z).",
    example: '=IMLN("3+4i")'
  },
  IMLOG10: {
    overview:
      "Returns the base-10 logarithm of a complex number. Useful in measuring signal gains, decibels, and logarithmic scaling.",
    usage: "IMLOG10(inumber)",
    notes:
      "Important in electrical engineering when analyzing magnitudes and frequencies.",
    example: '=IMLOG10("6+2i")'
  },

  IMLOG2: {
    overview:
      "Returns the base-2 logarithm of a complex number. Used in computing, DSP, and binary scaling contexts.",
    usage: "IMLOG2(inumber)",
    notes:
      "Useful for converting magnitudes to binary logarithmic scales.",
    example: '=IMLOG2("8+i")'
  },
  IMPOWER: {
    overview:
      "Raises a complex number to a given power. Used in signal transformation, rotations, and AC circuit analysis.",
    usage: "IMPOWER(inumber, power)",
    notes:
      "Complex exponentiation corresponds to scaling and rotating in the complex plane.",
    example: '=IMPOWER("3+4i", 2)'
  },
  IMPRODUCT: {
    overview:
      "Multiplies two or more complex numbers. Useful in phasor calculations, impedance modeling, and wave interactions.",
    usage: "IMPRODUCT(inumber1, inumber2, ...)",
    notes:
      "Products of complex numbers combine magnitudes and add angles, following Euler's representation.",
    example: '=IMPRODUCT("2+3i", "1+i")'
  },
  IMREAL: {
    overview:
      "Returns the real part of a complex number. Useful when separating real and imaginary components during analysis.",
    usage: "IMREAL(inumber)",
    notes:
      "Accepts standard complex text formats (e.g., 'a+bi').",
    example: '=IMREAL("3-7i")' // 3
  },
  IMSEC: {
    overview:
      "Returns the secant of a complex number. Mostly used in advanced engineering math and signal processing.",
    usage: "IMSEC(inumber)",
    notes:
      "Complex trigonometric functions describe oscillations, resonance, and transformations.",
    example: '=IMSEC("1+i")'
  },
  IMSECH: {
    overview:
      "Returns the hyperbolic secant of a complex number. Appears in physics and engineering, especially in wave equations.",
    usage: "IMSECH(inumber)",
    notes:
      "Hyperbolic functions appear in modeling decay, growth, and certain differential equations.",
    example: '=IMSECH("2+i")'
  },

  IMSIN: {
    overview:
      "Returns the sine of a complex number. Useful in wave equations, AC analysis, and harmonic analysis.",
    usage: "IMSIN(inumber)",
    notes:
      "Handles both real and imaginary components.",
    example: '=IMSIN("2+i")'
  },
  IMSINH: {
    overview:
      "Returns the hyperbolic sine of a complex number. Useful in engineering problems involving heat transfer and signal modeling.",
    usage: "IMSINH(inumber)",
    notes:
      "Hyperbolic sine functions appear in catenary curves, electrical filters, and growth models.",
    example: '=IMSINH("1+2i")'
  },
  IMSQRT: {
    overview:
      "Returns the square root of a complex number in a + bi format. This is used in electrical engineering, AC circuit analysis, and solving quadratic equations in the complex plane.",
    usage: "IMSQRT(inumber)",
    notes:
      "Complex square roots yield two values, but Excel returns the principal (primary) root.",
    example: '=IMSQRT("3+4i")'
  },
  IMSUB: {
    overview:
      "Subtracts one complex number from another. Common in phasor operations, impedance subtraction, and vector analysis in electrical systems.",
    usage: "IMSUB(inumber1, inumber2)",
    notes:
      "Supports subtraction of real and imaginary components in a+bi form.",
    example: '=IMSUB("7+5i", "3+2i")'
  },
  IMSUM: {
    overview:
      "Adds two or more complex numbers. Used frequently in AC power calculations, phasor summation, and signal combination.",
    usage: "IMSUM(inumber1, inumber2, ...)",
    notes:
      "Complex addition adds real parts and imaginary parts separately.",
    example: '=IMSUM("4+3i", "2+i", "1+0i")'
  },
  IMTAN: {
    overview:
      "Returns the tangent of a complex number. Useful in advanced signal processing, trigonometric modeling, and complex analysis.",
    usage: "IMTAN(inumber)",
    notes:
      "Tangent of complex numbers involves both hyperbolic and trigonometric components.",
    example: '=IMTAN("1+i")'
  },

  INDEX: {
    overview:
      "Returns a value or array from a table or range by row and column index. One of the most powerful lookup tools in Excel.",
    usage: "INDEX(array, row_num, [column_num])",
    notes:
      "Often paired with MATCH to replace VLOOKUP and enable dynamic lookups.",
    example: "=INDEX(A1:C10, 4, 2)"
  },
  INDIRECT: {
    overview:
      "Returns a reference specified by text. Useful for dynamic sheet names, dynamic ranges, and controlled formula redirection.",
    usage: "INDIRECT(ref_text, [a1])",
    notes:
      "Volatile — recalculates often. Accepts A1 or R1C1 styles.",
    example: '=INDIRECT("Sheet2!B5")'
  },
  INT: {
    overview:
      "Rounds a number down to the nearest integer. Always rounds toward negative infinity.",
    usage: "INT(number)",
    notes:
      "INT(-3.2) = -4; use TRUNC() if you want rounding toward zero.",
    example: "=INT(7.9)"
  },
  INTERCEPT: {
    overview:
      "Returns the y-intercept of the linear regression line that best fits the given data. Useful in finance, forecasting, and trend analysis.",
    usage: "INTERCEPT(known_y, known_x)",
    notes:
      "Used alongside SLOPE to model linear trends for pricing, projections, and performance metrics.",
    example: "=INTERCEPT({3, 6, 9}, {1, 2, 3})"
  },
  INTRATE: "Returns interest rate for a fully vested security.",
  IPMT: {
    overview:
      "Returns the interest portion of a payment in a given period. Used in loan amortization schedules.",
    usage: "IPMT(rate, period, nper, pv, [fv], [type])",
    notes:
      "type=1 → payment at beginning; type=0 → end.",
    example: "=IPMT(0.05/12, 1, 60, 20000)"
  },
  IRR: {
    overview:
      "Returns the internal rate of return for a series of cash flows, typically used in capital budgeting and investment evaluation.",
    usage: "IRR(values, [guess])",
    notes:
      "Cash flow sequence must include at least one negative and one positive value. IRR is the discount rate where NPV equals zero.",
    example: "=IRR({-50000, 12000, 15000, 18000, 20000})"
  },
  ISBLANK: {
    overview:
      "Checks whether a cell or value is empty. Useful in validation, data cleaning, and dynamic logic.",
    usage: "ISBLANK(value)",
    notes:
      "ISBLANK(A1) is TRUE only if the cell contains nothing — not even a formula returning empty text.",
    example: "=ISBLANK(A1)"
  },
  ISERR: {
    overview:
      "Returns TRUE for any error except #N/A. Useful in catching problematic inputs without flagging missing lookups.",
    usage: "ISERR(value)",
    notes:
      "Catches errors like #DIV/0!, #VALUE!, #REF!, #NUM!, etc.",
    example: "=ISERR(1/0)"
  },
  ISERROR: {
    overview:
      "Returns TRUE for any error including #N/A. Useful for general error handling.",
    usage: "ISERROR(value)",
    notes:
      "Often wrapped with IF for fallback logic: IF(ISERROR(x), alt, x).",
    example: "=ISERROR(A1/B1)"
  },
  ISEVEN: {
    overview:
      "Checks whether a number is even. Useful for ID validation, alternating row logic, and pattern-based formulas.",
    usage: "ISEVEN(number)",
    notes:
      "TRUE for even integers; decimals are truncated before checking.",
    example: "=ISEVEN(8)"
  },
  ISFORMULA: {
    overview:
      "Returns TRUE if a cell contains a formula. Useful in auditing and dynamic processing.",
    usage: "ISFORMULA(reference)",
    notes:
      "Works only with actual cell references — not values.",
    example: "=ISFORMULA(A1)"
  },

  ISLOGICAL: {
    overview:
      "Checks whether value is TRUE or FALSE. Useful in verifying expected boolean output.",
    usage: "ISLOGICAL(value)",
    notes:
      "TRUE/FALSE only — not numbers or text.",
    example: "=ISLOGICAL(FALSE)"
  },
  ISNA: {
    overview:
      "Returns TRUE only if the value is the #N/A (Not Available) error. Useful for lookup functions where #N/A indicates 'not found'.",
    usage: "ISNA(value)",
    notes:
      "Used to differentiate missing data from other errors.",
    example: "=ISNA(VLOOKUP(\"X\", A1:B10, 2, FALSE))"
  },
  ISNONTEXT: {
    overview:
      "Returns TRUE if a value is *not* text. Numbers, dates, booleans, and empty cells all return TRUE.",
    usage: "ISNONTEXT(value)",
    notes:
      "Opposite of ISTEXT, except that empty cells return TRUE.",
    example: "=ISNONTEXT(123)" // TRUE
  },

  ISNUMBER: {
    overview:
      "Checks whether a value is a number. Useful in validation, cleaning data, and conditional formulas.",
    usage: "ISNUMBER(value)",
    notes:
      "Returns FALSE for numeric text such as \"123\".",
    example: "=ISNUMBER(\"123\")" // FALSE
  },
  ISODD: {
    overview:
      "Returns TRUE if a number is odd. Used in alternating formatting, parity checks, and conditional logic.",
    usage: "ISODD(number)",
    notes:
      "Decimals are truncated before checking parity.",
    example: "=ISODD(7)" // TRUE
  },
  ISREF: {
    overview:
      "Checks if a value is a reference. Useful when validating dynamic references or INDIRECT outputs.",
    usage: "ISREF(value)",
    notes:
      "Returns TRUE only for actual cell references.",
    example: "=ISREF(A1)" // TRUE
  },

  ISTEXT: {
    overview:
      "Returns TRUE if a value is text. Useful for cleaning data, ensuring correct formatting, and text-based conditions.",
    usage: "ISTEXT(value)",
    notes:
      "Returns TRUE for empty strings (\"\") created by formulas.",
    example: '=ISTEXT("hello")'
  },
  ISOCEILING: "Rounds a number up (ISO compliant).",
  ISOWEEKNUM: "Returns ISO compliant week number.",
  KURT: {
    overview:
      "Returns the kurtosis of a data set, measuring the heaviness of the tails relative to a normal distribution. Used in finance to evaluate tail risk.",
    usage: "KURT(number1, number2, ...)",
    notes:
      "High kurtosis indicates higher probability of extreme events — useful in risk management and market analysis.",
    example: "=KURT({2, 4, 4, 6, 8, 50})"
  },
  LARGE: {
    overview:
      "Returns the k-th largest value in a dataset. Useful in ranking, leaderboard extraction, and identifying extremes.",
    usage: "LARGE(array, k)",
    notes:
      "k=1 returns the maximum value.",
    example: "=LARGE({10,25,30,18}, 2)" // 25
  },

  LCM: {
    overview:
      "Returns the least common multiple of integers. Useful in scheduling intervals, ratios, and cycle alignment.",
    usage: "LCM(number1, number2, ...)",
    notes:
      "Inputs must be integers.",
    example: "=LCM(6, 15)" // 30
  },
  LEFT: {
    overview:
      "Extracts a given number of characters from the left side of a text string. Useful for codes, prefixes, parsing, and cleaning.",
    usage: "LEFT(text, [num_chars])",
    notes:
      "If num_chars is omitted → defaults to 1.",
    example: '=LEFT("Spreadsheet", 5)' // "Sprea"
  },
  LEFTB: {
    overview:
      "Byte-based version of LEFT, for DBCS languages (Japanese, Chinese, Korean). Counts bytes instead of characters.",
    usage: "LEFTB(text, [num_bytes])",
    notes:
      "Used only with double-byte character sets.",
    example: '=LEFTB("テスト", 2)'
  },
  LEN: {
    overview:
      "Returns the number of characters in a text string. Useful in validation, parsing, and formatting.",
    usage: "LEN(text)",
    notes:
      "Counts all characters including spaces.",
    example: '=LEN("Hello World")'
  },

  LENB: {
    overview:
      "Returns string length in *bytes*, not characters. Used in DBCS environments.",
    usage: "LENB(text)",
    notes:
      "Double-byte characters count as 2 bytes.",
    example: '=LENB("テスト")'
  },

  LINEST: {
    overview:
      "Returns regression statistics for a line using the least-squares method. Outputs slope, intercept, and statistics.",
    usage: "LINEST(known_y, [known_x], [const], [stats])",
    notes:
      "stats=TRUE returns full regression metrics (R², SE, F-stat, etc.).",
    example: "=LINEST({3,6,9},{1,2,3})"
  },
  LN: {
    overview:
      "Returns the natural logarithm (base e). Used in exponential models, finance, calculus, and growth analysis.",
    usage: "LN(number)",
    notes:
      "Input must be > 0.",
    example: "=LN(10)"
  },
  LOG: {
    overview:
      "Returns the logarithm of a number to a specified base. Used in scaling, statistics, and modeling.",
    usage: "LOG(number, [base])",
    notes:
      "Default base = 10 if omitted.",
    example: "=LOG(100, 10)" // 2
  },
  LOG10: {
    overview:
      "Returns the base-10 logarithm of a number. Commonly used in scientific notation, pH calculations, decibels, and scaling.",
    usage: "LOG10(number)",
    notes:
      "Input must be > 0.",
    example: "=LOG10(1000)" // 3
  },
  LOGEST: {
    overview:
      "Returns exponential regression statistics by fitting the data to the curve y = b * m^x. Used for growth models and forecasting.",
    usage: "LOGEST(known_y, [known_x], [const], [stats])",
    notes:
      "stats=TRUE returns additional regression statistics like R², SE, F-stat.",
    example: "=LOGEST({3,8,20},{1,2,3})"
  },

  LOGINV: {
    overview:
      "Returns the inverse of the lognormal cumulative distribution. Used in financial modeling, risk simulation, and natural-growth processes.",
    usage: "LOGINV(probability, mean, standard_dev)",
    notes:
      "Lognormal models are common when values cannot go below zero (e.g., stock prices, demand forecasts).",
    example: "=LOGINV(0.95, 1.5, 0.4)"
  },
  LOGNORMDIST: {
    overview:
      "Returns the lognormal cumulative distribution. Common in modeling prices, biological growth, and skewed real-world data.",
    usage: "LOGNORMDIST(x, mean, standard_dev)",
    notes:
      "Useful for asset price modeling and risk estimation in financial economics.",
    example: "=LOGNORMDIST(4.5, 1.5, 0.4)"
  },
  LOGNORMINV: {
    overview:
      "Returns the inverse of the lognormal distribution. Given a probability, it returns the x-value where the distribution reaches that probability.",
    usage: "LOGNORMINV(probability, mean, standard_dev)",
    notes:
      "Used in Monte Carlo simulations and price distribution modeling.",
    example: "=LOGNORMINV(0.85, 1.5, 0.4)"
  },
  LOOKUP: "Looks up a value in a vector or array.",
  LOWER: {
    overview:
      "Converts text to lowercase. Useful in normalization, case-insensitive comparisons, and cleaning.",
    usage: "LOWER(text)",
    notes:
      "Does not affect numbers or symbols.",
    example: '=LOWER("HELLO World!")'
  },
  MATCH: {
    overview:
      "Returns the position of a lookup value in a range. Commonly used with INDEX to replace VLOOKUP/XLOOKUP.",
    usage: "MATCH(lookup_value, lookup_array, [match_type])",
    notes:
      "match_type: 0 = exact, 1 = less-than, -1 = greater-than.",
    example: "=MATCH(\"B\", {\"A\",\"B\",\"C\"}, 0)" // 2
  },
  MAX: {
    overview:
      "Returns the maximum value from a dataset. Useful in reporting, analytics, and boundary checks.",
    usage: "MAX(number1, number2, ...)",
    notes:
      "Ignores text values.",
    example: "=MAX(5, 9, 12, 3)"
  },
  MAXA: {
    overview:
      "Returns the maximum value while treating logical values and text differently: TRUE=1, FALSE=0, text=0.",
    usage: "MAXA(value1, value2, ...)",
    notes:
      "Useful in datasets with booleans or mixed data.",
    example: "=MAXA({10, FALSE, \"text\", TRUE})"
  },
  MAXIF: "Returns the maximum value that meets a condition.",
  MAXIFS: {
    overview:
      "Returns the maximum value that satisfies multiple conditions. Very useful for multi-criteria filtering.",
    usage:
      "MAXIFS(max_range, criteria_range1, criteria1, [criteria_range2, criteria2], ...)",
    notes:
      "Similar to AVERAGEIFS, SUMIFS pattern.",
    example:
      '=MAXIFS(C1:C100, A1:A100, "North", B1:B100, ">50")'
  },
  MDETERM: {
    overview:
      "Returns the determinant of a matrix, which indicates whether the matrix is invertible and represents scaling in linear transformations.",
    usage: "MDETERM(array)",
    notes:
      "Determinant is zero for singular matrices — important in solving systems of linear equations.",
    example: "=MDETERM({{1,2},{3,4}})"
  },
  MDURATION: {
    overview:
      "Returns the modified Macaulay duration for a security. Measures a bond's price sensitivity to interest rate changes.",
    usage: "MDURATION(settlement, maturity, coupon, yield, frequency, [basis])",
    notes:
      "Used in bond portfolio risk management to estimate interest rate exposure.",
    example:
      '=MDURATION("2024-01-01", "2030-01-01", 0.05, 0.045, 2)'
  },
  MEDIAN: {
    overview:
      "Returns the median (middle) value of a dataset. Robust measure of central tendency, especially when outliers exist.",
    usage: "MEDIAN(number1, number2, ...)",
    notes:
      "Ignores text and logical values.",
    example: "=MEDIAN(10, 100, 20, 30)"
  },
  MID: {
    overview:
      "Extracts text from the middle of a string. Very useful for parsing IDs, extracting substrings, and cleaning data.",
    usage: "MID(text, start_num, num_chars)",
    notes:
      "start_num begins at 1.",
    example: '=MID("ABCDEFG", 3, 2)' // "CD"
  },
  MIDB: {
    overview:
      "Byte-based version of MID for DBCS languages. Uses bytes instead of character positions.",
    usage: "MIDB(text, start_byte, num_bytes)",
    notes:
      "Used in Japanese, Chinese, Korean environments.",
    example: '=MIDB("テストコード", 2, 4)'
  },
  MIN: {
    overview:
      "Returns the smallest number in a dataset. Useful in reporting, analytics, and validation.",
    usage: "MIN(number1, number2, ...)",
    notes:
      "Ignores text values.",
    example: "=MIN(5, 9, -3, 12)"
  },
  MINA: {
    overview:
      "Returns the minimum value but treats text and booleans differently: TRUE=1, FALSE=0, text=0.",
    usage: "MINA(value1, value2, ...)",
    notes:
      "Useful when working with surveys, boolean flags.",
    example: "=MINA({10, FALSE, \"text\", TRUE})"
  },
  MINIF: "Returns the minimum value that meets a condition.",
  MINIFS: {
    overview:
      "Returns the minimum value that satisfies multiple conditions. Used in advanced filtering and analytics.",
    usage:
      "MINIFS(min_range, criteria_range1, criteria1, [criteria_range2, criteria2], ...)",
    notes:
      "Exact counterpart to MAXIFS and SUMIFS.",
    example:
      '=MINIFS(C1:C100, A1:A100, "South", B1:B100, ">100")'
  },
  MINUTE: {
    overview:
      "Extracts the minute (0–59) from a time value. Useful for time-based analytics.",
    usage: "MINUTE(time)",
    notes:
      "Works with text times or serial numbers.",
    example: '=MINUTE("12:45:30")' // 45
  },
  MIRR: {
    overview:
      "Returns the modified internal rate of return for cash flows. Unlike IRR, MIRR accounts for finance and reinvestment rates.",
    usage: "MIRR(values, finance_rate, reinvest_rate)",
    notes:
      "More realistic than IRR in many business cases.",
    example: "=MIRR({-10000, 4000, 5000, 7000}, 0.1, 0.12)"
  },
  MMULT: {
    overview:
      "Returns the matrix product of two arrays. Used in linear algebra, statistical modeling, 3D transformations, and optimization.",
    usage: "MMULT(array1, array2)",
    notes:
      "The number of columns in array1 must match the rows in array2. Results in a matrix of size (rows1 × cols2).",
    example: "=MMULT({{1,2},{3,4}}, {{5,6},{7,8}})"
  },
  MOD: {
    overview:
      "Returns remainder after division. Common in cycles, repeating patterns, schedules, and parity checks.",
    usage: "MOD(number, divisor)",
    notes:
      "Always returns a non-negative result.",
    example: "=MOD(17, 5)" // 2
  },
  MODE: {
    overview:
      "Returns the most frequently occurring number in a dataset. Useful in analyzing repeated behaviors, demand patterns, or common values.",
    usage: "MODE(number1, number2, ...)",
    notes:
      "If multiple values appear with the same frequency, MODE returns the first one.",
    example: "=MODE({3, 3, 4, 5, 5, 5, 6})"
  },
  MODEMULT: {
    overview:
      "Returns an array of all modes (most frequent values) in a dataset. Useful in cases with multi-modal distributions where multiple peaks exist.",
    usage: "MODE.MULT(number1, number2, ...)",
    notes:
      "Returns multiple results; must be entered as a dynamic array or range spill.",
    example: "=MODE.MULT({2, 3, 3, 5, 5, 7})"
  },
  MODESNGL: {
    overview:
      "Returns a single mode (first smallest) from a dataset. Equivalent to MODE.SNGL.",
    usage: "MODE.SNGL(number1, number2, ...)",
    notes:
      "Use MODE.MULT when multiple values are meaningful.",
    example: "=MODE.SNGL({1,2,2,3,3})"
  },
  MONTH: {
    overview:
      "Returns the month of a given date as a number from 1 to 12. Useful for time-based reporting, grouping data by month, or extracting components of a date.",
    usage: "MONTH(date)",
    notes:
      "Works with any valid Excel date or date-serial number. Combine with YEAR() for monthly period labels.",
    example: '=MONTH("2024-08-15")'
  },

  MROUND: {
    overview:
      "Rounds a number to the nearest multiple of a specified value. Useful in pricing, packaging, logistics, and anywhere rounding must follow specific rules.",
    usage: "MROUND(number, multiple)",
    notes:
      "Both number and multiple must share the same sign. Negative rounding is allowed.",
    example: "=MROUND(47, 5)"
  },

  MULTINOMIAL: {
    overview:
      "Returns the multinomial coefficient, used in probability and combinatorics to count the number of ways to partition items into groups.",
    usage: "MULTINOMIAL(number1, number2, ...)",
    notes:
      "Useful in machine learning, statistics, and discrete probability models such as categorical distributions.",
    example: "=MULTINOMIAL(2, 3, 4)"
  },

  N: {
    overview:
      "Converts a value to a number. TRUE→1, FALSE→0, numbers unchanged, errors → errors, text → 0.",
    usage: "N(value)",
    notes:
      "Useful for coercing values into numeric context.",
    example: "=N(TRUE)" // 1
  },
  NA: "Returns the #N/A error.",
  NEGBINOMDIST: {
    overview:
      "Returns the negative binomial distribution, which models the probability of observing a certain number of failures before achieving a target number of successes.",
    usage: "NEGBINOMDIST(failures, successes, probability_s)",
    notes:
      "Useful in quality control, reliability testing, and modeling repeated trials until success.",
    example: "=NEGBINOMDIST(5, 3, 0.4)"
  },
  NETWORKDAYS: {
    overview:
      "Returns the number of working days between two dates, excluding weekends and optionally holidays. Used in payroll, scheduling, and project planning.",
    usage: "NETWORKDAYS(start_date, end_date, [holidays])",
    notes:
      "By default excludes Saturday and Sunday. Add holiday ranges for more accurate business calendars.",
    example: '=NETWORKDAYS("2024-04-01", "2024-04-30")'
  },

  NETWORKDAYSINTL: {
    overview:
      "Returns the number of working days between two dates using a custom weekend pattern. Useful for countries or companies with non-standard weekends.",
    usage: "NETWORKDAYS.INTL(start_date, end_date, [weekend], [holidays])",
    notes:
      "Weekend codes allow specifying which days (e.g., Friday–Saturday) are weekends.",
    example: '=NETWORKDAYS.INTL("2024-01-01","2024-01-31", 7)'
  },
  NOMINAL: {
    overview:
      "Converts an effective annual interest rate into a nominal annual rate based on compounding periods. Used in financial comparisons and loan calculations.",
    usage: "NOMINAL(effect_rate, npery)",
    notes:
      "Nominal rate is the stated rate before compounding; effective rate includes compounding impact.",
    example: "=NOMINAL(0.085, 12)"
  },
  NORMDIST: {
    overview:
      "Returns the normal distribution for a given mean and standard deviation. Used heavily in statistics, probability, and analytics.",
    usage: "NORM.DIST(x, mean, standard_dev, cumulative)",
    notes:
      "cumulative=TRUE returns CDF; FALSE returns PDF.",
    example: "=NORM.DIST(1.5, 0, 1, TRUE)"
  },
  NORMINV: {
    overview:
      "Returns the inverse normal distribution. Given a probability, returns the x-value for that percentile under a normal curve.",
    usage: "NORMINV(probability, mean, standard_dev)",
    notes:
      "Used in VaR (Value at Risk), Monte Carlo simulation, and statistical thresholding.",
    example: "=NORMINV(0.95, 100, 15)"
  },
  NORMSDIST: {
    overview:
      "Returns the standard normal cumulative distribution, assuming mean 0 and standard deviation 1. Widely used in z-score analysis.",
    usage: "NORMSDIST(z)",
    notes:
      "Useful for converting z-scores to probabilities in standard normal statistics.",
    example: "=NORMSDIST(1.28)"
  },
  NORMSINV: {
    overview:
      "Returns the inverse standard normal distribution. Given a probability, returns the corresponding z-score.",
    usage: "NORMSINV(probability)",
    notes:
      "Used in finance for confidence intervals, VaR, and simulation inputs.",
    example: "=NORMSINV(0.975)"
  },
  NOT: {
    overview:
      "Reverses the logical value. Converts TRUE→FALSE and FALSE→TRUE.",
    usage: "NOT(logical)",
    notes:
      "Useful in complex conditional formulas.",
    example: "=NOT(TRUE)" // FALSE
  },
  NOW: {
    overview:
      "Returns the current date and time. Useful for timestamps and dynamic reports.",
    usage: "NOW()",
    notes:
      "Volatile function — recalculates whenever the sheet recalculates.",
    example: "=NOW()"
  },
  NPER: {
    overview:
      "Returns the number of periods required for an investment or loan to reach a future value. Used in finance and amortization schedules.",
    usage: "NPER(rate, pmt, pv, [fv], [type])",
    notes:
      "type = 0 → end of period; 1 → beginning.",
    example: "=NPER(0.05/12, -500, 20000)"
  },
  NPV: {
    overview:
      "Returns the net present value of a series of cash flows at a given discount rate. Common in finance, valuation, and project evaluation.",
    usage: "NPV(rate, value1, value2, ...)",
    notes:
      "Assumes cash flows occur at the end of each period.",
    example: "=NPV(0.08, {-1000, 300, 400, 500})"
  },
  OCT2BIN: {
    overview:
      "Converts an octal number to binary. Useful in digital systems, computing, and number base conversions.",
    usage: "OCT2BIN(number, [places])",
    notes:
      "Optional places pads result with leading zeros.",
    example: '=OCT2BIN("17")' // 1111
  },
  OCT2DEC: {
    overview:
      "Converts an octal number to decimal. Used in legacy computing and coding systems.",
    usage: "OCT2DEC(number)",
    notes:
      "Valid for octal numbers 0–7.",
    example: '=OCT2DEC("17")' // 15
  },
  OCT2HEX: {
    overview:
      "Converts an octal number to hexadecimal. Useful in file systems, permissions, and lower-level computing.",
    usage: "OCT2HEX(number, [places])",
    notes:
      "Optional places pads output.",
    example: '=OCT2HEX("31")'
  },
  ODD: {
    overview:
      "Rounds a number up to the nearest odd integer (away from zero). Useful in engineering constraints and discrete modeling.",
    usage: "ODD(number)",
    notes:
      "Negative numbers round toward negative infinity.",
    example: "=ODD(6.2)" // 7
  },
  ODDFPRICE: {
    overview:
      "Returns the price per $100 face value of a security with an odd (short or long) first period. Used in bond pricing when the first coupon period is irregular.",
    usage: "ODDFPRICE(settlement, maturity, issue, first_coupon, rate, yield, redemption, frequency, [basis])",
    notes:
      "Irregular first coupon periods occur when bonds are issued off-cycle from standard coupon schedules.",
    example:
      '=ODDFPRICE("2024-04-01", "2030-04-01", "2024-01-15", "2024-07-01", 0.05, 0.048, 100, 2)'
  },
  ODDFYIELD: {
    overview:
      "Returns the yield of a security with an odd first period. Useful when analyzing bonds issued off the regular coupon schedule.",
    usage:
      "ODDFYIELD(settlement, maturity, issue, first_coupon, rate, price, redemption, frequency, [basis])",
    notes:
      "Used for evaluating irregular-period bonds and calculating yield-to-maturity under atypical timelines.",
    example:
      '=ODDFYIELD("2024-04-01", "2030-04-01", "2024-01-15", "2024-07-01", 0.05, 98.5, 100, 2)'
  },
  ODDLPRICE: {
    overview:
      "Returns the price of a security with an odd last coupon period. Applies when the maturity date does not align with regular coupon intervals.",
    usage:
      "ODDLPRICE(settlement, maturity, last_coupon, rate, yield, redemption, frequency, [basis])",
    notes:
      "Used for pricing bonds with irregular last periods, such as those called early or structured differently.",
    example:
      '=ODDLPRICE("2024-04-01", "2029-01-15", "2028-07-01", 0.05, 0.047, 100, 2)'
  },
  ODDLYIELD: {
    overview:
      "Returns the yield of a security with an odd last coupon period. Useful for YTM calculations in bonds with irregular maturity alignment.",
    usage:
      "ODDLYIELD(settlement, maturity, last_coupon, rate, price, redemption, frequency, [basis])",
    notes:
      "Critical for evaluating callable bonds or those that redeem off regular schedules.",
    example:
      '=ODDLYIELD("2024-04-01", "2029-01-15", "2028-07-01", 0.05, 99, 100, 2)'
  },
  OFFSET: "Returns a reference shifted from a starting point.",
  OR: {
    overview:
      "Returns TRUE if any of the logical inputs are TRUE. Used in conditional formulas and branching logic.",
    usage: "OR(logical1, logical2, ...)",
    notes:
      "Evaluates arguments left-to-right and stops when TRUE is found.",
    example: "=OR(A1>10, B1<5)"
  },
  PDURATION: {
    overview:
      "Returns the number of periods required for an investment to reach a specified value. Useful for loan payoff planning and investment growth projections.",
    usage: "PDURATION(rate, present_value, future_value)",
    notes:
      "Assumes compound growth each period. Useful for 'how long until I reach X amount?' calculations.",
    example: "=PDURATION(0.06, 5000, 10000)"
  },
  PEARSON: {
    overview:
      "Returns the Pearson correlation coefficient between two datasets. Used in statistics, finance, and machine learning to measure linear relationships.",
    usage: "PEARSON(array1, array2)",
    notes:
      "A correlation close to +1 indicates strong positive correlation; −1 indicates strong negative correlation.",
    example: "=PEARSON({2,4,6}, {3,8,11})"
  },
  PERCENTILE: {
    overview:
      "Returns the k-th percentile of a dataset. Percentiles are used to understand distribution thresholds such as top 10%, bottom 5%, or median performance.",
    usage: "PERCENTILE(array, k)",
    notes:
      "Use k between 0 and 1 (e.g., 0.9 for the 90th percentile). Useful in risk scoring, grading systems, and performance benchmarking.",
    example: "=PERCENTILE({12,15,18,30,42}, 0.90)"
  },
  PERCENTILEEXC: {
    overview:
      "Returns the k-th percentile of a dataset excluding the endpoints. This matches statistical standards that avoid 0% and 100% percentiles.",
    usage: "PERCENTILE.EXC(array, k)",
    notes:
      "Only valid for 0 < k < 1. Often used for financial stress testing and removing extreme boundary cases.",
    example: "=PERCENTILE.EXC({5,10,15,20,25,30}, 0.75)"
  },
  PERCENTILEINC: {
    overview:
      "Returns the k-th percentile including the endpoints. Equivalent to PERCENTILE but explicitly named for clarity.",
    usage: "PERCENTILE.INC(array, k)",
    notes:
      "Allows k = 0 and k = 1. Good for full-range percentile breakdowns.",
    example: "=PERCENTILE.INC({10,20,30,40,50}, 0.20)"
  },
  PERCENTRANK: {
    overview:
      "Returns the percentage rank of a value in a dataset. Indicates the relative standing of a value compared to the data.",
    usage: "PERCENTRANK(array, x, [significance])",
    notes:
      "Useful in grading, analytics, and understanding how extreme or common a point is.",
    example: "=PERCENTRANK({12,15,18,40}, 18)"
  },
  PERCENTRANKEXC: {
    overview:
      "Returns the percentage rank of a value, excluding 0% and 100%. Used when boundary values should not map to endpoints.",
    usage: "PERCENTRANK.EXC(array, x, [significance])",
    notes:
      "Matches statistical standards that treat the minimum and maximum as interior points.",
    example: "=PERCENTRANK.EXC({5,10,15,20}, 15)"
  },
  PERCENTRANKINC: {
    overview:
      "Returns the percentage rank including endpoints. Equivalent to PERCENTRANK behavior prior to Excel 2010.",
    usage: "PERCENTRANK.INC(array, x, [significance])",
    notes:
      "Useful for inclusive percentile systems such as academic scoring bands.",
    example: "=PERCENTRANK.INC({10,20,30,40}, 30)"
  },
  PERMUT: {
    overview:
      "Returns the number of permutations for selecting items where order matters. Used in probability, combinatorics, and arrangement counting.",
    usage: "PERMUT(number, number_chosen)",
    notes:
      "Permutations grow extremely fast; useful for calculating possible arrangements.",
    example: "=PERMUT(10, 3)"
  },
  PERMUTATIONA: {
    overview:
      "Returns the number of permutations with repetitions allowed. Useful for counting combinations of repeated characters or codes.",
    usage: "PERMUTATIONA(number, number_chosen)",
    notes:
      "Used in generating ID codes, passwords, and repeated sequence combinations.",
    example: "=PERMUTATIONA(5, 3)"
  },
  PHI: {
    overview:
      "Returns the value of the standard normal probability density function at x. Useful in risk modeling and statistical curve-fitting.",
    usage: "PHI(x)",
    notes:
      "Represents the height of the normal curve at a specific z-score.",
    example: "=PHI(1.2)"
  },
  PI: "Returns the value of π.",
  PMT: {
    overview:
      "Returns the periodic payment for a loan or investment based on constant payments and a constant interest rate.",
    usage: "PMT(rate, nper, pv, [fv], [type])",
    notes:
      "type=0 → end of period (default), type=1 → beginning.",
    example: "=PMT(0.05/12, 60, 20000)"
  },
  POISSON: {
    overview:
      "Returns the Poisson distribution probability, useful for modeling counts of independent events (calls, arrivals, defects).",
    usage: "POISSON(x, mean, cumulative)",
    notes:
      "cumulative=TRUE → P(X ≤ x).",
    example: "=POISSON(4, 2.5, TRUE)"
  },
  POISSONDIST: {
    overview:
      "Returns the Poisson distribution, which models the probability of a number of events occurring in a fixed interval. Useful for queues, demand forecasting, and rare-event modeling.",
    usage: "POISSON.DIST(x, mean, cumulative)",
    notes:
      "Used for modeling counts such as customer arrivals, defects, or system failures.",
    example: "=POISSON.DIST(4, 2.5, TRUE)"
  },

  POWER: {
    overview:
      "Raises a number to a given power. Equivalent to number^power.",
    usage: "POWER(number, power)",
    notes:
      "Use for exponentiation in math and modeling.",
    example: "=POWER(3, 4)" // 81
  },

  PPMT: {
    overview:
      "Returns the principal portion of a payment for a given period in a loan amortization schedule.",
    usage: "PPMT(rate, period, nper, pv, [fv], [type])",
    notes:
      "Complements IPMT for interest portion.",
    example: "=PPMT(0.05/12, 1, 60, 20000)"
  },
  PRICE: {
    overview:
      "Returns the price per $100 face value of a security with periodic interest payments. Used in fixed-income pricing and bond valuation.",
    usage:
      "PRICE(settlement, maturity, rate, yield, redemption, frequency, [basis])",
    notes:
      "Useful for calculating clean price of coupon-bearing bonds based on yield assumptions.",
    example:
      '=PRICE("2024-04-01", "2034-04-01", 0.05, 0.046, 100, 2)'
  },

  PRICEDISC: {
    overview:
      "Returns the price of a discounted security such as a Treasury bill. Used for short-term instruments sold at a discount rather than with coupons.",
    usage: "PRICEDISC(settlement, maturity, discount, redemption, [basis])",
    notes:
      "Useful for T-bills, commercial paper, and zero-coupon instruments.",
    example:
      '=PRICEDISC("2024-04-01", "2024-10-01", 0.042, 100)'
  },
  PRICEMAT: {
    overview:
      "Returns the price per $100 of a security that pays interest at maturity. Common with zero-coupon bonds or single-payment notes.",
    usage:
      "PRICEMAT(settlement, maturity, issue, rate, yield, [basis])",
    notes:
      "Useful for valuing bonds that accumulate interest over their lifetime instead of paying periodically.",
    example:
      '=PRICEMAT("2024-04-01", "2030-04-01", "2024-01-01", 0.05, 0.045)'
  },
  PROB: {
    overview:
      "Returns probability that a value falls within a range, given a set of discrete values and their probabilities.",
    usage: "PROB(x_range, prob_range, [lower_limit], [upper_limit])",
    notes:
      "If upper_limit omitted, computes exactly P(X = lower_limit).",
    example: "=PROB({1,2,3},{0.2,0.3,0.5},1,2)"
  },

  PRODUCT: {
    overview:
      "Returns the product of numbers. Equivalent to multiplying all inputs.",
    usage: "PRODUCT(number1, number2, ...)",
    notes:
      "Empty cells ignored; text returns error.",
    example: "=PRODUCT(2,3,4)" // 24
  },
  PROPER: {
    overview:
      "Converts text to proper case (first letter of each word capitalized). Useful for names and titles.",
    usage: "PROPER(text)",
    notes:
      "Does not change fully uppercase acronyms (e.g., 'USA' → 'Usa').",
    example: '=PROPER("hello world")'
  },
  PV: {
    overview:
      "Returns the present value of an investment or loan. Based on discount rate, payment amount, and number of periods.",
    usage: "PV(rate, nper, pmt, [fv], [type])",
    notes:
      "Positive PV means money received; negative means paid.",
    example: "=PV(0.05/12, 60, -400)"
  },
  QUARTILE: {
    overview:
      "Returns the quartile of a dataset. Used in statistical analysis to divide data into four equal groups.",
    usage: "QUARTILE(array, quart)",
    notes:
      "Common for reporting distributions, boxplots, or identifying outliers (Q1, Median, Q3).",
    example: "=QUARTILE({15,22,25,29,34,41}, 3)"
  },
  QUARTILEEXC: {
    overview:
      "Returns the quartile of a dataset, excluding the minimum and maximum values. Used for statistical analysis following exclusive quantile definitions.",
    usage: "QUARTILE.EXC(array, quart)",
    notes:
      "Useful when you want quartiles that do not include boundary points, aligning with certain statistical standards.",
    example: "=QUARTILE.EXC({10, 15, 20, 30, 50, 70, 90}, 1)"
  },
  QUARTILEINC: {
    overview:
      "Returns the quartile of a dataset, including the endpoints. Equivalent to QUARTILE but explicitly named for clarity.",
    usage: "QUARTILE.INC(array, quart)",
    notes:
      "Useful for summary statistics, boxplots, and inclusive quantile calculations.",
    example: "=QUARTILE.INC({10, 20, 30, 40, 50}, 2)"
  },
  QUOTIENT: {
    overview:
      "Returns the integer portion of a division. Useful when you need whole-number division, such as grouping counts or distributing items.",
    usage: "QUOTIENT(numerator, denominator)",
    notes:
      "Ignores remainder values; use MOD to compute remainder separately.",
    example: "=QUOTIENT(17, 5)"
  },
  RADIANS: {
    overview:
      "Converts degrees to radians. Common in trigonometry, engineering, and geometry computations.",
    usage: "RADIANS(angle)",
    notes:
      "Radians are required for most trigonometric functions in mathematics and physics.",
    example: "=RADIANS(180)"
  },
  RAND: {
    overview:
      "Returns a random decimal number between 0 and 1. Recalculates on every sheet refresh.",
    usage: "RAND()",
    notes:
      "Volatile — changes whenever workbook recalculates.",
    example: "=RAND()"
  },
  RANDBETWEEN: {
    overview:
      "Returns a random integer between a lower and upper bound. Useful for simulations, testing, random sampling.",
    usage: "RANDBETWEEN(bottom, top)",
    notes:
      "Bottom and top must be integers.",
    example: "=RANDBETWEEN(1, 100)"
  },
  RANK: {
    overview:
      "Returns the rank of a number within a dataset. Useful for performance scoring, grading systems, and percentile-based rankings.",
    usage: "RANK(number, array, [order])",
    notes:
      "If order=0 or omitted, ranking is descending; order=1 ranks ascending.",
    example: "=RANK(85, {60,70,85,90,95})"
  },
  RANKEQ: {
    overview:
      "Returns the rank of a value using the RANK.EQ method, which treats ties as having the same rank. Common in academic scoring and competitive grading.",
    usage: "RANK.EQ(number, array, [order])",
    notes:
      "Equivalent values receive identical rank; the next rank is skipped accordingly.",
    example: "=RANK.EQ(90, {70,90,90,100})"
  },
  RANKAVG: {
    overview:
      "Returns the rank using the RANK.AVG method, which assigns tied values the average of their ranking positions.",
    usage: "RANK.AVG(number, array, [order])",
    notes:
      "Used in non-competitive scoring systems where ties should not create gaps.",
    example: "=RANK.AVG(90, {70,90,90,100})"
  },
  RATE: {
    overview:
      "Returns the interest rate per period for an investment or loan. Useful when the payment, number of periods, and present/future value are known.",
    usage:
      "RATE(nper, pmt, pv, [fv], [type], [guess])",
    notes:
      "Financial modeling often uses RATE to compute implied return or required interest rates.",
    example: "=RATE(36, -300, 8000)"
  },
  RECEIVED: {
    overview:
      "Returns the amount received at maturity for a fully invested security. Used for fixed-term investments and zero-coupon bond evaluation.",
    usage: "RECEIVED(settlement, maturity, rate, redemption, [basis])",
    notes:
      "Common for bank certificates, discount notes, and similar investments.",
    example:
      '=RECEIVED("2024-04-01", "2025-04-01", 0.045, 100)'
  },

  REGISTERID: {
    overview:
      "Utility function used in Formula.js for registering functions. Not an Excel function and rarely used in spreadsheets.",
    usage: "REGISTERID(id)",
    notes:
      "Mostly internal to Formula.js library.",
    example: "=REGISTERID(5)"
  },
  REPLACE: {
    overview:
      "Replaces part of a text string with another, starting from a specified position. Useful for formatting, masking sensitive data, or modifying structured text.",
    usage: "REPLACE(old_text, start, num_chars, new_text)",
    notes:
      "Count characters starting from 1, not 0. Use SUBSTITUTE for replacing by matching text.",
    example: '=REPLACE("123456789", 4, 3, "XXX")'
  },
  REPLACEB: {
    overview:
      "Replaces part of a text string using byte position. Used in languages where certain characters require multiple bytes.",
    usage: "REPLACEB(old_text, start_byte, num_bytes, new_text)",
    notes:
      "Primarily used for double-byte character sets (DBCS) such as Chinese, Japanese, or Korean.",
    example: '=REPLACEB("こんにちは", 3, 3, "★")'
  },
  REPT: {
    overview:
      "Repeats text a specified number of times. Useful for data visualization, creating bar charts in cells, or padding text.",
    usage: "REPT(text, number_times)",
    notes:
      "Although often used decoratively, it can also format reports with fixed-width patterns.",
    example: '=REPT("*", 10)'
  },
  RIGHT: {
    overview:
      "Returns the rightmost characters of a text string. Useful for extracting codes, suffixes, or fixed-format identifiers.",
    usage: "RIGHT(text, [num_chars])",
    notes:
      "Combine with LEN and FIND for more advanced text parsing.",
    example: '=RIGHT("ABCDEFG", 3)'
  },
  RIGHTB: {
    overview:
      "Returns the rightmost characters of text using byte count, not character count. Required for multi-byte languages.",
    usage: "RIGHTB(text, [num_bytes])",
    notes:
      "Use when working with CJK text where some characters occupy two bytes.",
    example: '=RIGHTB("漢字テスト", 4)'
  },
  ROMAN: {
    overview:
      "Converts a number into Roman numerals. Used for formatting outlines, titles, labels, or classical numbering styles.",
    usage: "ROMAN(number, [form])",
    notes:
      "The 'form' argument controls the degree of simplification (0 = classic, 4 = simplified).",
    example: "=ROMAN(2024)"
  },
  ROUND: {
    overview:
      "Rounds a number to a specified number of decimal places. Commonly used in financial reporting, pricing, tax calculations, and formatting values.",
    usage: "ROUND(number, num_digits)",
    notes:
      "If num_digits is positive, rounds to the right of the decimal. If negative, rounds to tens, hundreds, etc.",
    example: "=ROUND(123.456, 2)"
  },
  ROUNDDOWN: {
    overview:
      "Rounds a number down toward zero. Useful for budgeting, inventory allocation, and avoiding overestimation.",
    usage: "ROUNDDOWN(number, num_digits)",
    notes:
      "Always rounds downward, regardless of the decimal value.",
    example: "=ROUNDDOWN(7.89, 1)"
  },
  ROUNDUP: {
    overview:
      "Rounds a number up away from zero. Useful when you need to avoid underestimation, such as calculating required units or capacity.",
    usage: "ROUNDUP(number, num_digits)",
    notes:
      "Always rounds upward, regardless of the decimal value.",
    example: "=ROUNDUP(7.12, 1)"
  },
  ROW: {
    overview:
      "Returns the row number of a reference. Commonly used in dynamic formulas, indexing, and structured workbook logic.",
    usage: "ROW([reference])",
    notes:
      "If no argument is provided, ROW() returns the row of the cell it's in.",
    example: "=ROW(A15)"
  },
  ROWS: {
    overview:
      "Returns the number of rows in an array or range. Useful for array formulas, dynamic ranges, and table indexing.",
    usage: "ROWS(array)",
    notes:
      "Often used together with INDEX, OFFSET, and SEQUENCE.",
    example: "=ROWS(A1:C10)"
  },
  RRI: {
    overview:
      "Returns the equivalent interest rate for an investment that grows from pv to fv over nper periods.",
    usage: "RRI(nper, pv, fv)",
    notes:
      "Useful for backward-solving compound interest.",
    example: "=RRI(10, 1000, 2000)"
  },
  RSQ: {
    overview:
      "Returns the square of the Pearson correlation coefficient (R²). Measures how well a regression line fits the data. Used in analytics, forecasting, and statistical modeling.",
    usage: "RSQ(known_y, known_x)",
    notes:
      "R² close to 1 indicates a strong fit; close to 0 indicates a weak fit.",
    example: "=RSQ({2,4,6,8}, {1,2,3,4})"
  },
  SEARCH: {
    overview:
      "Finds the position of one text string within another, ignoring case. Useful for locating keywords, extracting substrings, and cleaning data.",
    usage: "SEARCH(find_text, within_text, [start_num])",
    notes:
      "Returns the numeric position of the match. Use FIND for case-sensitive searches.",
    example: '=SEARCH("cat", "Concatenate")'
  },
  SEARCHB: {
    overview:
      "Finds text within another text using byte indexing instead of character indexing. Used for languages with multi-byte characters.",
    usage: "SEARCHB(find_text, within_text, [start_byte])",
    notes:
      "Designed for DBCS languages like Japanese or Chinese.",
    example: '=SEARCHB("テ", "テスト")'
  },
  SEC: {
    overview:
      "Returns the secant of an angle. Appears in trigonometry, physics, and engineering calculations involving waveforms and rotations.",
    usage: "SEC(number)",
    notes:
      "Input is in radians. Convert degrees using RADIANS().",
    example: "=SEC(RADIANS(60))"
  },
  SECH: {
    overview:
      "Returns the hyperbolic secant of a number. Appears in engineering, statistics, and modeling of decay and wave behavior.",
    usage: "SECH(number)",
    notes:
      "Often used in solving differential equations and modeling signal attenuation.",
    example: "=SECH(1.2)"
  },
  SECOND: {
    overview:
      "Returns the seconds component from a time value (0–59). Useful for timestamp parsing, logging, and time-based analytics.",
    usage: "SECOND(time)",
    notes:
      "Extracts seconds from both text-formatted times and serial numbers.",
    example: '=SECOND("12:45:37")'
  },
  SERIESSUM: {
    overview:
      "Returns the sum of a power series. Useful in numerical analysis, polynomial approximations, and engineering calculations.",
    usage: "SERIESSUM(x, n, m, coefficients)",
    notes:
      "Represents expansions such as Taylor series or curve approximations.",
    example: "=SERIESSUM(1.2, 0, 1, {1,2,3})"
  },
  SIGN: {
    overview:
      "Returns the sign of a number: 1 for positive, -1 for negative, and 0 for zero. Useful for normalization, direction checks, and mathematical logic.",
    usage: "SIGN(number)",
    notes:
      "Useful in formulas needing direction of movement or comparing numeric polarity.",
    example: "=SIGN(-42)"
  },
  SIN: {
    overview:
      "Returns the sine of an angle. Used heavily in physics, trigonometry, and oscillatory modeling.",
    usage: "SIN(number)",
    notes:
      "Input must be in radians. Convert degrees with RADIANS().",
    example: "=SIN(RADIANS(30))"
  },
  SINH: {
    overview:
      "Returns the hyperbolic sine of a number. Used in engineering, heat transfer, and curve modeling.",
    usage: "SINH(number)",
    notes:
      "Represents the shape of hanging cables, growth patterns, and hyperbolic models.",
    example: "=SINH(1.5)"
  },
  SKEW: {
    overview:
      "Returns the skewness of a distribution, measuring asymmetry. Useful in statistics, finance, and data science.",
    usage: "SKEW(number1, number2, ...)",
    notes:
      "Positive skew = long right tail; negative skew = long left tail.",
    example: "=SKEW({1,2,2,3,10})"
  },

  SKEWP: {
    overview:
      "Returns population skewness, dividing by N instead of N-1. Used when working with full population data.",
    usage: "SKEW.P(number1, number2, ...)",
    notes:
      "Use SKEW() for sample skewness.",
    example: "=SKEW.P({1,2,2,3,10})"
  },
  SLN: {
    overview:
      "Returns straight-line depreciation for an asset. Used in accounting and finance.",
    usage: "SLN(cost, salvage, life)",
    notes:
      "Even depreciation each period.",
    example: "=SLN(50000, 5000, 10)"
  },
  SLOPE: {
    overview:
      "Returns the slope of the linear regression line through x- and y-values.",
    usage: "SLOPE(known_y, known_x)",
    notes:
      "Slope = rise/run.",
    example: "=SLOPE({3,6,9},{1,2,3})" // 3
  },

  SMALL: {
    overview:
      "Returns the k-th smallest value in a range. Useful in filtering and percentile-like analytics.",
    usage: "SMALL(array, k)",
    notes:
      "k=1 returns minimum.",
    example: "=SMALL({10,5,8,20}, 2)" // 8
  },

  SQRT: {
    overview:
      "Returns the square root of a number. Very commonly used in math and statistics.",
    usage: "SQRT(number)",
    notes:
      "Input must be ≥ 0.",
    example: "=SQRT(49)" // 7
  },

  SQRTPI: {
    overview:
      "Returns the square root of (number × π). Commonly used in statistics, geometry, and probability calculations involving circular or normal distributions.",
    usage: "SQRTPI(number)",
    notes:
      "SQRTPI(n) is equivalent to SQRT(n * PI()). Useful in distributions and integrals.",
    example: "=SQRTPI(3)"
  },
  STANDARDIZE: {
    overview:
      "Returns a normalized z-score for a value relative to a dataset. Useful in statistics, machine learning, and quality control.",
    usage: "STANDARDIZE(x, mean, standard_dev)",
    notes:
      "A standardized value indicates how many standard deviations a point is from the mean.",
    example: "=STANDARDIZE(72, 60, 10)"
  },
  STDEV: {
    overview:
      "Returns the sample standard deviation of a dataset. Indicates variability or spread. Used in risk analysis, quality control, and descriptive statistics.",
    usage: "STDEV(number1, number2, ...)",
    notes:
      "Uses sample formula (n−1). For full population, use STDEVP.",
    example: "=STDEV({10, 20, 30, 40, 50})"
  },

  STDEVA: {
    overview:
      "Returns the sample standard deviation including text and logical values. Useful in mixed datasets that encode TRUE/FALSE or categorical numeric codes.",
    usage: "STDEVA(value1, value2, ...)",
    notes:
      "TRUE counts as 1, FALSE as 0. Use only if you intend to include these values.",
    example: "=STDEVA({10, TRUE, 20, FALSE})"
  },
  STDEVP: {
    overview:
      "Returns the population standard deviation for an entire dataset. Used when your data represents the full population rather than a sample.",
    usage: "STDEVP(number1, number2, ...)",
    notes:
      "Population standard deviation divides by n, not n−1.",
    example: "=STDEVP({4, 6, 8, 14})"
  },
  STDEVPA: {
    overview:
      "Returns the population standard deviation including text and logical values. Useful when datasets include encoded logical states.",
    usage: "STDEVPA(value1, value2, ...)",
    notes:
      "TRUE is 1, FALSE is 0; use only when such encoding is intentional.",
    example: "=STDEVPA({5, TRUE, FALSE, 12})"
  },

  STEYX: {
    overview:
      "Returns the standard error of a predicted y-value for each x in a regression. Useful for evaluating the reliability of trendlines.",
    usage: "STEYX(known_y, known_x)",
    notes:
      "Smaller STEYX values indicate a tighter fit to the regression line.",
    example: "=STEYX({10, 12, 15}, {1, 2, 3})"
  },
  SUBSTITUTE: {
    overview:
      "Replaces specific text within a string. Used for data cleaning, formatting, and transforming structured text.",
    usage: "SUBSTITUTE(text, old_text, new_text, [instance_num])",
    notes:
      "Use instance_num to control which occurrence is replaced, otherwise all are replaced.",
    example: '=SUBSTITUTE("2024-01-01", "-", "/")'
  },
  SUBTOTAL: {
    overview:
      "Calculates a subtotal using a selected function (SUM, AVERAGE, COUNT, etc.). Useful for filtered tables and grouped reports.",
    usage: "SUBTOTAL(function_num, range1, [range2], ...)",
    notes:
      "Ignores hidden rows when using function numbers 101–111.",
    example: "=SUBTOTAL(9, A1:A10)" // 9 = SUM
  },
  SUM: {
    overview:
      "Adds all the numbers in the given arguments. One of the most frequently used functions in spreadsheets.",
    usage: "SUM(number1, number2, ...)",
    notes:
      "Ignores text; treats empty cells as zero.",
    example: "=SUM(10, 20, 5)" // 35
  },
  SUMIF: {
    overview:
      "Returns the sum of values that meet a given condition. Useful for conditional analysis, filtering, and dynamic aggregation.",
    usage: "SUMIF(range, criteria, [sum_range])",
    notes:
      "Criteria support >, <, <>, and wildcards like * and ?.",
    example: '=SUMIF(A1:A10, ">50", B1:B10)'
  },
  SUMIFS: {
    overview:
      "Returns the sum of values meeting multiple criteria. Used in dashboards, financial models, and multi-condition analysis.",
    usage: "SUMIFS(sum_range, criteria_range1, criteria1, ...)",
    notes:
      "More flexible than SUMIF and supports unlimited conditions.",
    example: '=SUMIFS(C1:C20, A1:A20, "East", B1:B20, ">5000")'
  },
  SUMPRODUCT: {
    overview:
      "Returns the sum of the products of corresponding elements in arrays. Used in weighted averages, matrix-like operations, and conditional logic.",
    usage: "SUMPRODUCT(array1, [array2], ...)",
    notes:
      "Useful for multi-condition logic without requiring SUMIFS or helper columns.",
    example: "=SUMPRODUCT(A1:A5, B1:B5)"
  },
  SUMSQ: {
    overview:
      "Returns the sum of squares of a list of numbers. Used in statistical variance, regression, and vector magnitude calculations.",
    usage: "SUMSQ(number1, number2, ...)",
    notes:
      "Equivalent to SUM(x²). Useful for minimizing error in least-squares models.",
    example: "=SUMSQ(3, 4)" // 3² + 4² = 25
  },

  SUMX2MY2: {
    overview:
      "Returns the sum of the difference of squares for corresponding elements. Used in specialized statistical and engineering calculations.",
    usage: "SUMX2MY2(array_x, array_y)",
    notes:
      "Computes Σ(x² − y²). Arrays must be the same size.",
    example: "=SUMX2MY2({3,4}, {1,2})"
  },
  SUMX2PY2: {
    overview:
      "Returns the sum of the squares of sums for corresponding elements in two arrays. Useful in engineering, geometry, and statistical distance computations.",
    usage: "SUMX2PY2(array_x, array_y)",
    notes:
      "Computes Σ(x² + y²). Often used to calculate squared distances or magnitudes.",
    example: "=SUMX2PY2({2,3}, {4,1})"
  },
  SUMXMY2: {
    overview:
      "Returns the sum of squares of differences between corresponding values in two arrays. Useful in statistical error calculations.",
    usage: "SUMXMY2(array_x, array_y)",
    notes:
      "Computes Σ(x − y)². Common in regression analysis and machine learning.",
    example: "=SUMXMY2({3,5,7}, {2,4,9})"
  },

  SYD: {
    overview:
      "Returns the sum-of-years’ digits depreciation for an asset. Provides accelerated depreciation earlier in the asset’s life.",
    usage: "SYD(cost, salvage, life, period)",
    notes:
      "Faster depreciation method than straight-line; commonly used in accounting and asset management.",
    example: "=SYD(50000, 5000, 10, 1)"
  },
  T: {
    overview:
      "Returns text if the input is text; otherwise returns an empty string. Useful in cleaning mixed cells in imported data.",
    usage: "T(value)",
    notes:
      "Numbers, dates, and logicals return empty string.",
    example: '=T("Hello")'
  },
  TAN: {
    overview:
      "Returns the tangent of an angle. Used in trigonometry, geometry, physics, and modeling slopes.",
    usage: "TAN(number)",
    notes:
      "Input must be in radians.",
    example: "=TAN(RADIANS(45))"
  },
  TANH: {
    overview:
      "Returns the hyperbolic tangent of a number. Used in engineering, neural networks, and mathematical smoothing functions.",
    usage: "TANH(number)",
    notes:
      "Produces values between –1 and 1. Often used as an activation function in ML.",
    example: "=TANH(1.2)"
  },
  TBILLEQ: {
    overview:
      "Returns the bond-equivalent yield for a Treasury bill. Converts a discount yield into an annualized yield comparable to coupon bonds.",
    usage: "TBILLEQ(settlement, maturity, discount)",
    notes:
      "Useful for comparing T-bills to longer-term fixed-income securities.",
    example:
      '=TBILLEQ("2024-04-01", "2024-10-01", 0.042)'
  },
  TBILLPRICE: {
    overview:
      "Returns the price per $100 face value for a Treasury bill. Useful for pricing short-term discount securities.",
    usage: "TBILLPRICE(settlement, maturity, discount)",
    notes:
      "Treasury bills are sold at a discount and do not pay coupons.",
    example:
      '=TBILLPRICE("2024-04-01", "2024-07-01", 0.038)'
  },
  TBILLYIELD: {
    overview:
      "Returns the yield for a Treasury bill based on settlement, maturity, and price. Useful for analyzing short-term government securities.",
    usage: "TBILLYIELD(settlement, maturity, price)",
    notes:
      "Yield reflects the discount relative to the face value across the bill’s term.",
    example:
      '=TBILLYIELD("2024-04-01", "2024-10-01", 98.2)'
  },
  TEXT: {
    overview:
      "Formats a number using a specified format string. Used in reporting, dashboards, and converting numbers into readable formats.",
    usage: "TEXT(value, format_text)",
    notes:
      "Supports date formats, currency, decimals, percentages, etc.",
    example: '=TEXT(0.256, "0.0%")'
  },
  TEXTJOIN: {
    overview:
      "Joins multiple text values using a delimiter, with an option to ignore empty cells. Very powerful for building dynamic text lists.",
    usage: "TEXTJOIN(delimiter, ignore_empty, text1, text2, ...)",
    notes:
      "Often used to combine names, tags, or multi-cell text.",
    example: '=TEXTJOIN(", ", TRUE, A1:A5)'
  },
  TIME: {
    overview:
      "Returns a time value given hour, minute, and second. Useful for constructing times from components.",
    usage: "TIME(hour, minute, second)",
    notes:
      "Handles overflow: TIME(25,0,0) becomes 1:00 AM next day.",
    example: "=TIME(14, 30, 0)"
  },
  TIMEVALUE: {
    overview:
      "Converts a text time into a serial number. Used when importing text-formatted timestamps.",
    usage: "TIMEVALUE(time_text)",
    notes:
      "Result is a decimal between 0 and 1 representing the fraction of the day.",
    example: '=TIMEVALUE("18:45:00")'
  },
  TINV: {
    overview:
      "Returns the inverse of the two-tailed Student's t-distribution. Used to compute critical values for hypothesis testing.",
    usage: "TINV(probability, degrees_freedom)",
    notes:
      "For one-tailed tests, divide the probability by 2.",
    example: "=TINV(0.05, 20)"
  },
  TINV2T: {
    overview:
      "Formula.js alias for Excel's T.INV.2T — the two-tailed t-distribution inverse.",
    usage: "T.INV.2T(probability, degrees_freedom)",
    notes:
      "Improved accuracy over legacy TINV.",
    example: "=T.INV.2T(0.05, 12)"
  },
  TINV1T: {
    overview:
      "Formula.js alias for T.INV — the one-tailed t-distribution inverse.",
    usage: "T.INV(probability, degrees_freedom)",
    notes:
      "Used when testing one-directional hypotheses.",
    example: "=T.INV(0.05, 12)"
  },
  TODAY: {
    overview:
      "Returns the current date. Useful for dashboards, dynamic reports, and age or duration calculations.",
    usage: "TODAY()",
    notes:
      "Automatically updates each day. Contains no time component.",
    example: "=TODAY()"
  },
  TRANSPOSE: {
    overview:
      "Converts rows to columns and columns to rows. Useful for restructuring datasets, pivot-like operations, and matrix transformations.",
    usage: "TRANSPOSE(array)",
    notes:
      "Returns a dynamic array. In older Excel versions, must be entered as an array formula.",
    example: "=TRANSPOSE({1,2,3;4,5,6})"
  },
  TREND: {
    overview:
      "Returns predicted values along a linear trend based on known x- and y-values. Useful for forecasting sales, projecting performance, or estimating trends in time-series data.",
    usage: "TREND(known_y, known_x, [new_x], [const])",
    notes:
      "If const=TRUE or omitted, TREND calculates the best-fit line including intercept. Supports projecting values beyond the known range.",
    example: "=TREND({100,120,150}, {1,2,3}, 4)" // Predict period 4
  },
  TRIM: {
    overview:
      "Removes extra spaces from text, leaving only single spaces between words. Very useful when cleaning imported or user-entered data.",
    usage: "TRIM(text)",
    notes:
      "Removes leading, trailing, and repeated internal spaces. Does NOT remove non-breaking spaces.",
    example: '=TRIM("   Hello     World   ")'
  },
  TRIMMEAN: {
    overview:
      "Returns the mean of a range after excluding a percentage of data from the top and bottom. Useful for reducing the influence of outliers.",
    usage: "TRIMMEAN(array, percent)",
    notes:
      "Percent must be between 0 and 1. Useful in financial modeling, QA data cleanup, and robust analysis.",
    example: "=TRIMMEAN({10,12,14,100,110}, 0.4)"
  },

  TRUE: {
    overview:
      "Returns the logical value TRUE. Used for logic formulas, comparisons, or setting default boolean states.",
    usage: "TRUE()",
    notes:
      "Equivalent to entering TRUE directly. Often used inside IF or AND/OR formulas.",
    example: "=TRUE()"
  },
  TRUNC: {
    overview:
      "Truncates a number to a whole number or a specified number of decimal places without rounding. Useful for strict cut-offs such as ID extraction or integer conversion.",
    usage: "TRUNC(number, [num_digits])",
    notes:
      "Unlike ROUND, TRUNC simply removes digits, making it reliable for clean-cut numeric transformations.",
    example: "=TRUNC(12.987, 1)"
  },
  TYPE: {
    overview:
      "Returns a number representing the type of the value (1=number, 2=text, 4=logical, 16=error). Useful for debugging and validating mixed datasets.",
    usage: "TYPE(value)",
    notes:
      "Helpful when working with imported data where data types may be inconsistent.",
    example: "=TYPE(\"Hello\")"
  },
  UNICHAR: {
    overview:
      "Returns the Unicode character associated with a numeric code point. Useful for inserting symbols, icons, and international characters.",
    usage: "UNICHAR(number)",
    notes:
      "Supports Unicode up to 1114111. Useful for formatting, checkmarks, arrows, and custom UI.",
    example: "=UNICHAR(10004)" // ✓
  },
  UNICODE: {
    overview:
      "Returns the Unicode code number for the first character of a text string. Useful for analyzing non-ASCII characters and ensuring encoding consistency.",
    usage: "UNICODE(text)",
    notes:
      "Works on emojis, symbols, and international characters as well.",
    example: '=UNICODE("✓")'
  },
  UPPER: {
    overview:
      "Converts text to uppercase. Useful for normalizing input data, standardizing codes, or preparing text for case-insensitive matching.",
    usage: "UPPER(text)",
    notes:
      "Does not affect numbers or punctuation.",
    example: '=UPPER("hello world")'
  },
  VALUE: {
    overview:
      "Converts a text string that represents a number into an actual numeric value. Useful for imported datasets where numbers are stored as text.",
    usage: "VALUE(text)",
    notes:
      "Recognizes numeric formats like currency, dates, percentages depending on locale.",
    example: '=VALUE("42")'
  },
  VAR: {
    overview:
      "Returns the sample variance of a dataset. Measures the spread or dispersion of numbers around the mean.",
    usage: "VAR(number1, number2, ...)",
    notes:
      "Uses sample formula dividing by n−1. For entire populations use VARP.",
    example: "=VAR({10,20,30,40})"
  },
  VARA: {
    overview:
      "Returns sample variance including logicals and text. TRUE counts as 1, FALSE as 0. Useful only when these values are intentionally part of the dataset.",
    usage: "VARA(value1, value2, ...)",
    notes:
      "Be careful when using mixed data; unintended TRUE/FALSE values may distort variance.",
    example: "=VARA({10, TRUE, 30, FALSE})"
  },
  VARP: {
    overview:
      "Returns the population variance of a dataset. Used when the entire population is known, not just a sample.",
    usage: "VARP(number1, number2, ...)",
    notes:
      "Divides by n, not n−1. Common in complete financial datasets or controlled experiments.",
    example: "=VARP({5,7,9,15})"
  },
  VARPA: {
    overview:
      "Returns population variance including logicals and text. TRUE is 1 and FALSE is 0.",
    usage: "VARPA(value1, value2, ...)",
    notes:
      "Use only when TRUE/FALSE are semantically meaningful numeric inputs.",
    example: "=VARPA({5, TRUE, FALSE, 12})"
  },
  VDB: {
    overview:
      "Calculates depreciation using the variable declining balance method. Allows switching to straight-line depreciation when beneficial.",
    usage:
      "VDB(cost, salvage, life, start_period, end_period, [factor], [no_switch])",
    notes:
      "Useful for tax schedules, asset management, and accelerated depreciation scenarios.",
    example: "=VDB(50000, 5000, 10, 0, 1, 2)"
  },
  VLOOKUP: {
    overview:
      "Searches for a value in the first column of a table and returns a corresponding value from another column. Used extensively in reporting, data lookup, reconciliation, and mapping IDs to attributes.",
    usage: "VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])",
    notes:
      "range_lookup=FALSE forces exact matching. For sorted data with approximate matching, use TRUE. Consider XLOOKUP for modern replacements.",
    example: '=VLOOKUP("A102", A2:D100, 3, FALSE)'
  },
  WEEKDAY: {
    overview:
      "Returns the day of the week as a number. Useful for scheduling, date analysis, workday planning, and calendar formulas.",
    usage: "WEEKDAY(date, [return_type])",
    notes:
      "Different return_type values change numbering (e.g., Sunday=1 or Monday=1).",
    example: '=WEEKDAY("2024-08-15", 2)' // Thursday = 4 if Monday=1
  },
  WEEKNUM: {
    overview:
      "Returns the week number of a given date. Common in reporting cycles, fiscal calendars, and time-based grouping.",
    usage: "WEEKNUM(date, [return_type])",
    notes:
      "Default system starts on Sunday. ISO week numbering uses return_type=21.",
    example: '=WEEKNUM("2024-02-01", 21)'
  },
  WEIBULL: {
    overview:
      "Returns the Weibull distribution, commonly used in reliability engineering, survival analysis, and failure-time modeling.",
    usage: "WEIBULL(x, alpha, beta, cumulative)",
    notes:
      "Alpha controls shape (failure rate behavior), beta controls scale (time units).",
    example: "=WEIBULL(1200, 1.5, 1000, TRUE)"
  },
  WORKDAY: {
    overview:
      "Returns the date after a given number of working days, excluding weekends and optional holidays. Widely used in project management and scheduling.",
    usage: "WORKDAY(start_date, days, [holidays])",
    notes:
      "Negative days calculate previous workdays. Great for setting deadlines.",
    example: '=WORKDAY("2024-04-01", 15)'
  },
  WORKDAYINTL: {
    overview:
      "Returns the workday date using a custom weekend pattern. Useful for global teams with non-standard weekends.",
    usage: "WORKDAY.INTL(start_date, days, [weekend], [holidays])",
    notes:
      "Weekend parameter allows choosing specific weekend days.",
    example: '=WORKDAY.INTL("2024-01-01", 10, 7)'  // Friday–Saturday weekend
  },
  XIRR: {
    overview:
      "Returns the internal rate of return for cash flows occurring at irregular intervals. Commonly used in real investment analysis and financial modeling.",
    usage: "XIRR(values, dates, [guess])",
    notes:
      "Unlike IRR, dates do not need equal spacing. Useful for private equity, capital projects, and staged investments.",
    example:
      '=XIRR({-10000, 2500, 3000, 4000, 5000}, {"2024-01-01","2024-04-01","2024-08-01","2025-01-01","2025-06-01"})'
  },
  XNPV: {
    overview:
      "Returns the net present value of cash flows at irregular intervals. Used in advanced project finance and evaluation of non-uniform cashflow streams.",
    usage: "XNPV(rate, values, dates)",
    notes:
      "Discounts each cash flow based on exact time elapsed. Superior to NPV for real-world modeling.",
    example:
      '=XNPV(0.08, {-10000, 2500, 3000, 4000, 5000}, {"2024-01-01","2024-04-01","2024-08-01","2025-01-01","2025-06-01"})'
  },
  XOR: {
    overview:
      "Returns TRUE if an odd number of logical conditions are TRUE. Useful for validation rules, toggles, and exclusive conditions.",
    usage: "XOR(logical1, logical2, ...)",
    notes:
      "Behaves like 'either/or' across multiple conditions — TRUE only when the count of TRUEs is odd.",
    example: "=XOR(TRUE, FALSE, TRUE)" // returns FALSE (2 TRUEs = even)
  },
  YEAR: {
    overview:
      "Returns the year from a date. Useful for grouping reports, extracting date components, and time-based summaries.",
    usage: "YEAR(date)",
    notes:
      "Works with valid date serial numbers and strings.",
    example: '=YEAR("2024-10-15")'
  },
  YEARFRAC: {
    overview:
      "Returns the fraction of the year between two dates based on a chosen day-count basis. Used in bond pricing, interest accruals, and time-based metrics.",
    usage: "YEARFRAC(start_date, end_date, [basis])",
    notes:
      "Basis=0 uses US (NASD) 30/360; Basis=1 uses Actual/Actual.",
    example: '=YEARFRAC("2024-01-01", "2024-09-30", 1)'
  },
  ZTEST: {
    overview:
      "Returns the one-tailed probability value of a z-test. Used in hypothesis testing for population means when variance is known.",
    usage: "ZTEST(array, x, [sigma])",
    notes:
      "Smaller probabilities indicate statistical significance against the null hypothesis.",
    example: "=ZTEST({50,52,49,51,53}, 55)"
  },
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
    <div className="p-5 bg-white shadow rounded-lg border hover:shadow-md transition">

      <h2
        className="text-xl font-bold text-blue-600 mb-2 flex justify-between cursor-pointer"
        onClick={() => setOpen(!open)}
      >
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
          <div className="text-gray-800 text-sm mb-3 space-y-1">
            {typeof description === "string" ? (
              // If it's a simple text description → show normally
              <p>{description}</p>
            ) : (
              // If it's a detailed object with sections
              Object.entries(description).map(([key, value]) => (
                <p key={key}>
                  <strong className="capitalize">{key}:</strong> {value}
                </p>
              ))
            )}
          </div>

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

