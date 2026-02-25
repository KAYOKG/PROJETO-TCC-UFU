import { Request, Response, Router } from "express";
import { getDb, saveDb } from "../db/connection.js";
import { queryToObjects } from "../db/helpers.js";

const router = Router();

router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const db = await getDb();

    const blocks = queryToObjects(
      db,
      `SELECT * FROM user_blocks WHERE user_id = ? AND status = 'active' ORDER BY blocked_at DESC LIMIT 1`,
      [userId],
    );

    const block = blocks[0] as
      | { blocked_until: string | null; reason: string; status: string }
      | undefined;

    if (!block) {
      res.json({ blocked: false });
      return;
    }

    const now = new Date().toISOString();
    const blockedUntil = block.blocked_until;
    const stillBlocked = !blockedUntil || blockedUntil > now;

    if (!stillBlocked) {
      db.run(
        `UPDATE user_blocks SET status = 'expired' WHERE user_id = ? AND status = 'active' AND (blocked_until IS NULL OR blocked_until < ?)`,
        [userId, now],
      );
      saveDb();
      res.json({ blocked: false });
      return;
    }

    const invalidations = queryToObjects(
      db,
      `SELECT 1 FROM session_invalidations WHERE user_id = ?`,
      [userId],
    );
    const sessionInvalidated = invalidations.length > 0;
    const responseStatus = sessionInvalidated
      ? "confirmed_threat"
      : block.status;

    res.json({
      blocked: true,
      blockedUntil: block.blocked_until ?? undefined,
      reason: block.reason ?? undefined,
      status: responseStatus,
    });
  } catch (error) {
    console.error("Error checking user block:", error);
    res.status(500).json({ error: "Failed to check block status" });
  }
});

router.post("/:userId/unblock", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const { unblocked_by } = req.body as { unblocked_by?: string };

    const db = await getDb();
    const now = new Date().toISOString();

    db.run(
      `UPDATE user_blocks SET status = 'manually_unblocked', unblocked_by = ?, unblocked_at = ?
       WHERE user_id = ? AND status = 'active'`,
      [unblocked_by ?? "admin", now, userId],
    );

    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error("Error unblocking user:", error);
    res.status(500).json({ error: "Failed to unblock user" });
  }
});

export default router;
