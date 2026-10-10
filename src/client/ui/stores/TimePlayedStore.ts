import { RemoteEvents } from "client/network";

let timePlayed = 0;
const listeners = new Set<(time: number) => void>();

export const TimePlayedStore = {
	getTime() {
		return timePlayed;
	},

	setTime(newTime: number) {
		timePlayed = newTime;
		listeners.forEach((cb) => cb(timePlayed));
	},

	onChange(cb: (time: number) => void) {
		listeners.add(cb);
		return {
			Disconnect() {
				listeners.delete(cb);
			},
		};
	},
};

RemoteEvents.statisticsSync.connect((time) => {
	TimePlayedStore.setTime(time);
});
