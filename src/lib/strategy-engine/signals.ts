import type { Candle, StrategyConfig, StrategySignal, SwingPoint } from "./types";

type LineStatus = "ACTIVE" | "AWAITING_RETEST" | "DONE";

interface LineState {
  swing: SwingPoint;
  status: LineStatus;
  breakoutIndex?: number;
  touchedAtIndex?: number;
  closesAboveSinceTouch: number;
}

function makeSignal(
  index: number,
  candle: Candle,
  direction: StrategySignal["direction"],
  kind: StrategySignal["kind"],
  swing: SwingPoint,
): StrategySignal {
  return { index, time: candle.time, direction, kind, price: candle.close, swingPoint: swing };
}

/**
 * Walks candles forward and evaluates each confirmed swing line against the
 * user's breakout/retest rules:
 *
 *  - Swing LOW line: a close below the line fires an immediate BREAKOUT SHORT.
 *  - Swing HIGH line: a close above the line arms the line; once price comes
 *    back to retest it from above and holds a close above it for
 *    `confirmationBars` bars, a RETEST LONG fires. A decisive close back
 *    below the line while awaiting confirmation invalidates the setup.
 *
 * When `mirroredEnabled`, the same two behaviors are also applied to the
 * opposite side of each line (a swing-HIGH line breaking down fires an
 * immediate short; a swing-LOW line breaking up arms a retest-long) — see
 * the config-level comment for why this is opt-in rather than default.
 */
export function generateSignals(
  candles: Candle[],
  swingPoints: SwingPoint[],
  config: StrategyConfig,
): StrategySignal[] {
  const signals: StrategySignal[] = [];
  const lines: LineState[] = swingPoints.map((swing) => ({
    swing,
    status: "ACTIVE",
    closesAboveSinceTouch: 0,
  }));

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];

    for (const line of lines) {
      if (line.status === "DONE" || i < line.swing.confirmedAtIndex) continue;

      const price = line.swing.price;
      const tolerance = price * (config.retestTolerancePct / 100);

      if (line.status === "ACTIVE") {
        if (line.swing.type === "LOW") {
          if (candle.close < price) {
            signals.push(makeSignal(i, candle, "SHORT", "BREAKOUT", line.swing));
            line.status = "DONE";
            line.swing.resolvedAtIndex = i;
          } else if (config.mirroredEnabled && candle.close > price) {
            line.status = "AWAITING_RETEST";
            line.breakoutIndex = i;
          }
        } else {
          if (candle.close > price) {
            line.status = "AWAITING_RETEST";
            line.breakoutIndex = i;
          } else if (config.mirroredEnabled && candle.close < price) {
            signals.push(makeSignal(i, candle, "SHORT", "BREAKOUT", line.swing));
            line.status = "DONE";
            line.swing.resolvedAtIndex = i;
          }
        }
        continue;
      }

      // AWAITING_RETEST: waiting for price to come back and reclaim the line
      // from above, then hold, before confirming a long.
      if (i - line.breakoutIndex! > config.expireAfterBars) {
        line.status = "DONE";
        line.swing.resolvedAtIndex = i;
        continue;
      }

      if (line.touchedAtIndex === undefined && candle.low <= price + tolerance) {
        line.touchedAtIndex = i;
      }

      if (line.touchedAtIndex === undefined) continue;

      if (candle.close < price - tolerance) {
        // Decisive close back below the line: retest failed, abandon the setup.
        line.status = "DONE";
        line.swing.resolvedAtIndex = i;
        continue;
      }

      if (candle.close > price) {
        line.closesAboveSinceTouch += 1;
        if (line.closesAboveSinceTouch >= config.confirmationBars) {
          signals.push(makeSignal(i, candle, "LONG", "RETEST", line.swing));
          line.status = "DONE";
          line.swing.resolvedAtIndex = i;
        }
      } else {
        line.closesAboveSinceTouch = 0;
      }
    }
  }

  return signals.sort((a, b) => a.index - b.index);
}
