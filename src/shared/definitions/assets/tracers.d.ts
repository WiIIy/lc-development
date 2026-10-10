type tracers = Folder & {
	Beam1: Tracer;
	Flash: Model & {
		Flash: Part;
	};
	Smoke: Model & {
		Smoke: Part & {
			Smoke: ParticleEmitter;
		};
	};
};
