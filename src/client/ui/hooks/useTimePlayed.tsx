import { useState, useEffect } from "@rbxts/react";
import { TimePlayedStore } from "../stores/TimePlayedStore";

export function useTimePlayed(): number {
	const [time, setTime] = useState(() => TimePlayedStore.getTime());

	useEffect(() => {
		const connection = TimePlayedStore.onChange((newTime) => {
			setTime(newTime);
		});

		return () => connection.Disconnect();
	}, []);

	return time;
}
