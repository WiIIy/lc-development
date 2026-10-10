export function generateFrontDirections(characterCFrame: CFrame, count = 9): Vector3[] {
    const directions: Vector3[] = [];
    
    // Spread 18 rays evenly across -90° to +90° (180° total arc)
    for (let i = 0; i < count; i++) {
        const angle = math.rad(-90 + (180 / (count - 1)) * i);
        
        // Rotate local forward vector (0, 0, -1 in Roblox CFrame convention) by angle around Y-axis
        const localDir = CFrame.Angles(0, angle, 0).VectorToWorldSpace(new Vector3(0, 0, -1));
        
        // Transform local vector to character's world orientation
        const worldDir = characterCFrame.VectorToWorldSpace(localDir);
        directions.push(worldDir);
    }
    
    return directions;
}