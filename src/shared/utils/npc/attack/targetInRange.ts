const ATTACK_RANGE = 7; // studs
const ATTACK_HEIGHT_TOLERANCE = 6; 

export function isTargetInRange(selfPos: Vector3, targetPos: Vector3, range = ATTACK_RANGE): boolean {
    const dx = targetPos.X - selfPos.X;
    const dy = targetPos.Y - selfPos.Y;
    const dz = targetPos.Z - selfPos.Z;

    if (math.abs(dy) > ATTACK_HEIGHT_TOLERANCE) return false;
    return dx * dx + dz * dz <= range * range; // squared compare, no sqrt
}