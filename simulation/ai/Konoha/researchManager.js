/**
 * Manage the research
 */
KONOHA.ResearchManager = function(Config)
{
	this.Config = Config;
};

/**
 * Check if we can go to the next phase
 */
KONOHA.ResearchManager.prototype.checkPhase = function(gameState, queues)
{
	if (queues.majorTech.hasQueuedUnits())
		return;
	// Don't try to phase up if already trying to gather resources for a civil-centre or wonder
	if (queues.civilCentre.hasQueuedUnits() || queues.wonder.hasQueuedUnits())
		return;

	let currentPhaseIndex = gameState.currentPhase();
	let nextPhaseName = gameState.getPhaseName(currentPhaseIndex+1);
	if (!nextPhaseName)
		return;

	let konohaRequirements =
		currentPhaseIndex == 1 && gameState.ai.HQ.getAccountedPopulation(gameState) >= this.Config.Economy.popPhase2 ||
		currentPhaseIndex == 2 && gameState.ai.HQ.getAccountedWorkers(gameState) > this.Config.Economy.workPhase3 ||
		currentPhaseIndex >= 3 && gameState.ai.HQ.getAccountedWorkers(gameState) > this.Config.Economy.workPhase4;
	if (konohaRequirements && gameState.hasResearchers(nextPhaseName, true))
	{
		gameState.ai.HQ.phasing = currentPhaseIndex + 1;
		// Reset the queue priority in case it was changed during a previous phase update
		gameState.ai.queueManager.changePriority("majorTech", gameState.ai.Config.priorities.majorTech);
		queues.majorTech.addPlan(new KONOHA.ResearchPlan(gameState, nextPhaseName, true));
	}
};

KONOHA.ResearchManager.prototype.researchPopulationBonus = function(gameState, queues)
{
	if (queues.minorTech.hasQueuedUnits())
		return;

	let techs = gameState.findAvailableTech();
	for (let tech of techs)
	{
		if (!tech[1]._template.modifications)
			continue;
		// TODO may-be loop on all modifs and check if the effect if positive ?
		if (tech[1]._template.modifications[0].value !== "Population/Bonus")
			continue;
		queues.minorTech.addPlan(new KONOHA.ResearchPlan(gameState, tech[0]));
		break;
	}
};

KONOHA.ResearchManager.prototype.researchTradeBonus = function(gameState, queues)
{
/*	if (queues.minorTech.hasQueuedUnits())
		return;

	let techs = gameState.findAvailableTech();
	for (let tech of techs)
	{
		if (!tech[1]._template.modifications || !tech[1]._template.affects)
			continue;
		if (tech[1]._template.affects.indexOf("Trader") === -1)
			continue;
		// TODO may-be loop on all modifs and check if the effect if positive ?
		if (tech[1]._template.modifications[0].value !== "UnitMotion/WalkSpeed" &&
                    tech[1]._template.modifications[0].value !== "Trader/GainMultiplier")
			continue;
		queues.minorTech.addPlan(new KONOHA.ResearchPlan(gameState, tech[0]));
		break;
	}*///Nagasushi
};

/** Techs to be searched for as soon as they are available */
KONOHA.ResearchManager.prototype.researchTechsBandA = function(gameState, techs)
{
	let phase1 = gameState.currentPhase() === 1;
	let available = phase1 ? gameState.ai.queueManager.getAvailableResources(gameState) : null;
	let numWorkers = phase1 ? gameState.getOwnEntitiesByRole("worker", true).length : 0;
	for (let tech of techs)
	{
		if (tech[0] == "traditional_army_sele" || tech[0] == "reformed_army_sele")
			return { "name": pickRandom(["traditional_army_sele", "reformed_army_sele"]), "increasePriority": true };

		if (!tech[1]._template.modifications)
			continue;
		let template = tech[1]._template;
		if (phase1)
		{
			let cost = template.cost;
			let costMax = 0;
			for (let res in cost)
				costMax = Math.max(costMax, Math.max(cost[res]-available[res], 0));
			if (10*numWorkers < costMax)
				continue;
		}
		for (let i in template.modifications)
		{
      if (tech[0] == "gather_wicker_baskets")
			  return { "name": tech[0], "increasePriority": true };
		}
	}
	return null;
};

KONOHA.ResearchManager.prototype.researchTechsBandB = function(gameState, techs)
{
	let phase1 = gameState.currentPhase() === 1;
	let pop = gameState.getPopulation();
	let available = phase1 ? gameState.ai.queueManager.getAvailableResources(gameState) : null;
	let numWorkers = phase1 ? gameState.getOwnEntitiesByRole("worker", true).length : 0;
	for (let tech of techs)
	{
		if (!tech[1]._template.modifications)
			continue;
		if (pop < 45*this.Config.popScaling)
		  continue;
		let template = tech[1]._template;
		if (phase1)
		{
			let cost = template.cost;
			let costMax = 0;
			for (let res in cost)
				costMax = Math.max(costMax, Math.max(cost[res]-available[res], 0));
	  	if (4*numWorkers < costMax)
				continue;
		}
		for (let i in template.modifications)
		{
			if (gameState.ai.HQ.navalMap && template.modifications[i].value === "ResourceGatherer/Rates/food.fish")
				return { "name": tech[0], "increasePriority": this.CostSum(template.cost) < 400 };
			else if (tech[0] == "gather_lumbering_ironaxes")
			  return { "name": tech[0], "increasePriority": true };
			else if (tech[0] == "gather_capacity_basket")
			  return { "name": tech[0], "increasePriority": true };
			else if (tech[0] == "gather_farming_plows")
				return { "name": tech[0], "increasePriority": true };
		}
	}
	return null;
};

KONOHA.ResearchManager.prototype.researchTechsBandC = function(gameState, techs)
{
	let phase2 = gameState.currentPhase() === 2;
	let pop = gameState.getPopulation();
	let available = phase2 ? gameState.ai.queueManager.getAvailableResources(gameState) : null;
	let numWorkers = phase2 ? gameState.getOwnEntitiesByRole("worker", true).length : 0;
	for (let tech of techs)
	{
		if (!tech[1]._template.modifications)
			continue;
		if (pop < 140*this.Config.popScaling)
			continue;
		let template = tech[1]._template;
		if (phase2)
		{
			let cost = template.cost;
			let costMax = 0;
			for (let res in cost)
				costMax = Math.max(costMax, Math.max(cost[res]-available[res], 0));
			if (10*numWorkers < costMax)
				continue;
		}
		for (let i in template.modifications)
		{
      if (tech[0] == "gather_mining_servants")
				return { "name": tech[0], "increasePriority": true };
			else if (tech[0] == "gather_mining_wedgemallet")
			  return { "name": tech[0], "increasePriority": true };
			else if (template.modifications[i].value === "ResourceGatherer/Rates/wood.tree")
				return { "name": tech[0], "increasePriority": true };
			else if (template.modifications[i].value === "ResourceGatherer/Rates/food.grain")
				return { "name": tech[0], "increasePriority": true };
			else if (template.modifications[i].value === "Resistance/Entity/Damage/Pierce")
	 			return { "name": tech[0], "increasePriority": true };
	 		else if (template.modifications[i].value === "Attack/Ranged/Damage/Hack")
	 			return { "name": tech[0], "increasePriority": true };
	 		else if (template.modifications[i].value === "Attack/Melee/Damage/Hack")
	 			return { "name": tech[0], "increasePriority": true };
	 		else if (template.modifications[i].value === "Resistance/Entity/Damage/Hack")
	 			return { "name": tech[0], "increasePriority": true };
			else if (tech[0] == "hoplite_tradition")
				return { "name": tech[0], "increasePriority": true };
			else if (tech[0] == "infantry_movement_speed")
				return { "name": tech[0], "increasePriority": true };
			/*else if (tech[0] == "civil_service_01")
				return { "name": tech[0], "increasePriority": true };
			else if (tech[0] == "civil_engineering_01")
			  return { "name": tech[0], "increasePriority": true };*///Nagasuhi: doesn't work
		}
	}
	return null;
};

KONOHA.ResearchManager.prototype.researchTechsBandD = function(gameState, techs)
{
	let phase3 = gameState.currentPhase() === 3;
	let pop = gameState.getPopulation();
	let available = phase3 ? gameState.ai.queueManager.getAvailableResources(gameState) : null;
	let numWorkers = phase3 ? gameState.getOwnEntitiesByRole("worker", true).length : 0;
	for (let tech of techs)
	{
		if (!tech[1]._template.modifications)
			continue;
		if (pop < 220*this.Config.popScaling)
			continue;
		let template = tech[1]._template;
		if (phase3)
		{
			let cost = template.cost;
			let costMax = 0;
			for (let res in cost)
				costMax = Math.max(costMax, Math.max(cost[res]-available[res], 0));
			if (10*numWorkers < costMax)
				continue;
		}
		for (let i in template.modifications)
		{ if (template.modifications[i].value === "ProductionQueue/BatchTimeModifier")
			return { "name": tech[0], "increasePriority": true };//for barracks
		else if (tech[0] == "siege_attack")
			return { "name": tech[0], "increasePriority": true };//for siege
		else if (tech[0] == "unlock_champion_cavalry")
			return { "name": tech[0], "increasePriority": true };
		else if (tech[0] == "unlock_champion_chariots")
			return { "name": tech[0], "increasePriority": true };
		else if (tech[0] == "unlock_champion_infantry")
			return { "name": tech[0], "increasePriority": true };
		else if (tech[0] == "gather_mining_serfs")
			return { "name": tech[0], "increasePriority": true };
		else if (tech[0] == "gather_mining_shaftmining")
			return { "name": tech[0], "increasePriority": true };
		else if (tech[0] == "gather_capacity_carts")
			return { "name": tech[0], "increasePriority": true };
		else if (tech[0] == "nisean_horses")
			return { "name": tech[0], "increasePriority": true };
		else if (template.modifications[i].value === "Attack/Ranged/MaxRange")
			return { "name": tech[0], "increasePriority": true };
		else if (tech[0] == "cavalry_health")
			return { "name": tech[0], "increasePriority": true };
		else if (tech[0] == "cavalry_movement_speed")
			return { "name": tech[0], "increasePriority": true };
		else if (tech[0] == "cavalry_cost_time")
			return { "name": tech[0], "increasePriority": true };
		}
	}
	return null;
};

KONOHA.ResearchManager.prototype.researchTechsBandE = function(gameState, techs)
{
	let phase3 = gameState.currentPhase() === 3;
	let pop = gameState.getPopulation();
	let available = phase3 ? gameState.ai.queueManager.getAvailableResources(gameState) : null;
	let numWorkers = phase3 ? gameState.getOwnEntitiesByRole("worker", true).length : 0;
	for (let tech of techs)
	{
		if (!tech[1]._template.modifications)
			continue;
		if (pop < 230*this.Config.popScaling)
			continue;
		let template = tech[1]._template;
		if (phase3)
		{
			let cost = template.cost;
			let costMax = 0;
			for (let res in cost)
				costMax = Math.max(costMax, Math.max(cost[res]-available[res], 0));
			if (10*numWorkers < costMax)
				continue;
		}
		for (let i in template.modifications)
		{if (tech[0] == "siege_health")
			 return { "name": tech[0], "increasePriority": true };
	 	else if (tech[0] == "architecture_pers")
			return { "name": tech[0], "increasePriority": true };
		else if (tech[0] == "architecture_kush")
			return { "name": tech[0], "increasePriority": true };
		else if (tech[0] == "archer_attack_spread")
			return { "name": tech[0], "increasePriority": true };
		else if (tech[0] == "agoge")
			return { "name": tech[0], "increasePriority": true };
		else if (tech[0] == "colonization")
			return { "name": tech[0], "increasePriority": true };
		else if (tech[0] == "hellenistic_metropolis")
			return { "name": tech[0], "increasePriority": true };
		}
	}
	return null;
};

KONOHA.ResearchManager.prototype.update = function(gameState, queues)
{
	if (queues.minorTech.hasQueuedUnits() || queues.majorTech.hasQueuedUnits())
		return;

	let techs = gameState.findAvailableTech();

	let techName = this.researchTechsBandA(gameState, techs);
	if (techName)
	{
		if (techName.increasePriority)
		{
			gameState.ai.queueManager.changePriority("minorTech", 700*this.Config.priorities.minorTech);
			let plan = new KONOHA.ResearchPlan(gameState, techName.name);
			plan.queueToReset = "minorTech";
			queues.minorTech.addPlan(plan);
		}
		else
			queues.minorTech.addPlan(new KONOHA.ResearchPlan(gameState, techName.name));
		return;
	}

	techName = this.researchTechsBandB(gameState, techs);
	if (techName)
	{
	 if (techName.increasePriority)
		{
			gameState.ai.queueManager.changePriority("minorTech", 500*this.Config.priorities.minorTech);
			let plan = new KONOHA.ResearchPlan(gameState, techName.name);
			plan.queueToReset = "minorTech";
			queues.minorTech.addPlan(plan);
		}
		else
			queues.minorTech.addPlan(new KONOHA.ResearchPlan(gameState, techName.name));
		return;
	}

	if (gameState.currentPhase() < 2)
		return;

 	techName = this.researchTechsBandC(gameState, techs);
 	if (techName)
 	{
 	 if (techName.increasePriority)
 		{
 			gameState.ai.queueManager.changePriority("minorTech", 300*this.Config.priorities.minorTech);
 			let plan = new KONOHA.ResearchPlan(gameState, techName.name);
 			plan.queueToReset = "minorTech";
 			queues.minorTech.addPlan(plan);
 		}
 		else
 			queues.minorTech.addPlan(new KONOHA.ResearchPlan(gameState, techName.name));
 		return;
 	}

	if (gameState.currentPhase() < 3)
	  return;

		techName = this.researchTechsBandD(gameState, techs);
		if (techName)
		{
		 if (techName.increasePriority)
			{
				gameState.ai.queueManager.changePriority("minorTech", 40*this.Config.priorities.minorTech);
				let plan = new KONOHA.ResearchPlan(gameState, techName.name);
				plan.queueToReset = "minorTech";
				queues.minorTech.addPlan(plan);
			}
			else
				queues.minorTech.addPlan(new KONOHA.ResearchPlan(gameState, techName.name));
			return;

		}
		techName = this.researchTechsBandE(gameState, techs);
		if (techName)
		{
		 if (techName.increasePriority)
			{
				gameState.ai.queueManager.changePriority("minorTech", 20*this.Config.priorities.minorTech);
				let plan = new KONOHA.ResearchPlan(gameState, techName.name);
				plan.queueToReset = "minorTech";
				queues.minorTech.addPlan(plan);
			}
			else
				queues.minorTech.addPlan(new KONOHA.ResearchPlan(gameState, techName.name));
			return;
		}

 if (gameState.currentPhase() < 4)
   return;


	// remove some techs not yet used by this AI
	// remove also sharedLos if we have no ally
	// Obsolete -Nagasushi
	for (let i = 0; i < techs.length; ++i)
	{
		let template = techs[i][1]._template;
	  if (template.genericName && (template.genericName === "Espionage" || template.genericName === "Fertility Festival" || template.genericName === "Trade Caravan" || template.genericName === "Commercial Treaty" || template.genericName === "Counterintelligence" || template.genericName === "Counterintelligence" || template.genericName[0] === "Sentries" || template.genericName === "Arrow Shooters" || template.genericName === "Murder Holes" || template.genericName === "Sturdy Foundations" || template.genericName === "Crenellations" || template.genericName === "Conscription" || template.genericName === "Siegecraft" || template.genericName === "Home Garden" || template.genericName === "Iphicratean Reforms" || template.genericName === "Hellenistic Metropolis" || template.genericName[0] === "Battlefield Medicine" || template.genericName === "Living Conditions" || template.genericName === "Handicraft" || template.genericName === "Slaves" || template.genericName === "Monumental Architecture"))
		{
			techs.splice(i--, 1);
			continue;
		}

		if (template.affects && template.affects.length === 1 &&
			(template.affects[0] === "Healer" || template.affects[0] === "Outpost" || template.affects[0] === "Wall"))
		{
			techs.splice(i--, 1);
			continue;
		}
		if (template.modifications && template.modifications.length === 1 &&
			template.modifications[0].value === "Player/sharedLos" &&
			!gameState.hasAllies())
		{
			techs.splice(i--, 1);
			continue;
		}//Nagasushi

		/*if (template.affects && template.affects.length === 1 &&
			(template.affects[0] == "Soldier"))
		{
			continue;
		}*/
		else
		{
			techs.splice(i--, 1);
			continue;
		}
	}
	if (!techs.length)
		return;

	// randomly pick one. No worries about pairs in that case.
	queues.minorTech.addPlan(new KONOHA.ResearchPlan(gameState, pickRandom(techs)[0]));
};

KONOHA.ResearchManager.prototype.CostSum = function(cost)
{
	let costSum = 0;
	for (let res in cost)
		costSum += cost[res];
	return costSum;
};

KONOHA.ResearchManager.prototype.Serialize = function()
{
	return {};
};

KONOHA.ResearchManager.prototype.Deserialize = function(data)
{
};
