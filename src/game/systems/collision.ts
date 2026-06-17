// 레인별 AABB. 플레이어가 자기 레인 장애물의 갭 밖에 닿으면 충돌.
import { Player } from '../entities/Player';
import { LaneGap } from '../entities/ObstaclePair';

export function hitsObstacle(
  player: Player, gap: LaneGap, obstacleX: number, obstacleWidth: number,
): boolean {
  const overlapX = player.x + player.radius > obstacleX && player.x - player.radius < obstacleX + obstacleWidth;
  if (!overlapX) return false;
  const gapTop = gap.gapCenter - gap.gapHeight / 2;
  const gapBottom = gap.gapCenter + gap.gapHeight / 2;
  const insideGap = player.y - player.radius >= gapTop && player.y + player.radius <= gapBottom;
  return !insideGap;
}
