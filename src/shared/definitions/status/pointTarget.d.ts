type PointTarget = {
	key: string;
	position: Vector3;
	type: "walk" | "sit";
	seatInstance?: Seat;
	animations?: Animation[];
};
