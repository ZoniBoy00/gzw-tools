import ItemModal from './ui/ItemModal';
import { Section } from './GameItemExtras';
import {
  MONEY_ITEM_ID,
  capabilityList,
  craftTimeLabel,
  formatDollars,
  objectiveLine,
  totalBasePrice,
} from '../lib/gameData';
import type { Amount, GameItem, HideoutDevice, HideoutQuest, HideoutRecipe, QuestObjective } from '../lib/gameData';

type ItemIndex = Map<string, GameItem>;

function Thumb({ src }: { src?: string }) {
  if (!src) return <span className="inline-block h-9 w-9 shrink-0 border border-border bg-surface-2" aria-hidden="true" />;
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className="h-9 w-9 shrink-0 object-contain border border-border bg-surface-2"
      onError={event => { event.currentTarget.style.visibility = 'hidden'; }}
    />
  );
}

/** Materials with picture, amount and base price; dollars are shown as money. */
function Materials({ list, byId }: { list: Amount[]; byId: ItemIndex }) {
  return (
    <ul className="space-y-1">
      {list.map(entry => {
        const item = byId.get(entry.id);
        const money = entry.id === MONEY_ITEM_ID;
        return (
          <li key={entry.id} className="flex items-center gap-2 text-xs">
            <Thumb src={item?.image} />
            <span className="min-w-0 flex-1 truncate">{money ? 'Cash' : entry.name ?? entry.id}</span>
            <span className="font-mono">{money ? formatDollars(entry.amount) : `×${entry.amount.toLocaleString('en-US')}`}</span>
            {!money && item?.base_price !== undefined && <span className="w-16 text-right font-mono text-text-muted">{formatDollars(item.base_price * entry.amount)}</span>}
          </li>
        );
      })}
    </ul>
  );
}

function ValueNote({ list, byId, label }: { list: Amount[]; byId: ItemIndex; label: string }) {
  const { total, unpriced } = totalBasePrice(list, byId);
  return (
    <p className="mt-1 text-[11px] text-text-muted">
      {label}: <span className="font-mono text-text">{formatDollars(total)}</span>{unpriced ? ` (${unpriced} without a price)` : ''}
      <span className="text-text-muted/70"> · base prices, not vendor quotes</span>
    </p>
  );
}

export function RecipeModal({ recipe, byId, onClose }: { recipe: HideoutRecipe; byId: ItemIndex; onClose: () => void }) {
  const output = recipe.outputs[0] ? byId.get(recipe.outputs[0].id) : undefined;
  const needs = capabilityList(recipe.required_capabilities);
  return (
    <ItemModal
      gameData={false}
      onClose={onClose}
      item={{
        name: recipe.name ?? recipe.id,
        image: output?.image,
        type: 'parts',
        fields: [
          { label: 'Workbench', value: recipe.pipeline, desc: 'Hideout room and bench type that makes it' },
          { label: 'Craft time', value: craftTimeLabel(recipe.craft_time_seconds) },
          ...(needs ? [{ label: 'Needs', value: needs, desc: 'Hideout capabilities the room must provide' }] : []),
          ...(recipe.known_by_default ? [{ label: 'Recipe', value: 'Known from the start' }] : []),
        ],
      }}
    >
      <Section title="Ingredients">
        <Materials list={recipe.inputs} byId={byId} />
        <ValueNote list={recipe.inputs} byId={byId} label="Ingredients worth" />
      </Section>
      <Section title="Produces">
        <Materials list={recipe.outputs} byId={byId} />
        <ValueNote list={recipe.outputs} byId={byId} label="Result worth" />
      </Section>
    </ItemModal>
  );
}

export function DeviceModal({ device, byId, devices, onClose }: { device: HideoutDevice; byId: ItemIndex; devices: HideoutDevice[]; onClose: () => void }) {
  const next = device.next_upgrade ? devices.find(entry => entry.id === device.next_upgrade) : undefined;
  const provides = capabilityList(device.capabilities_provided);
  const requires = capabilityList(device.capabilities_required);
  const infraRequired = capabilityList(device.infrastructure_required);
  const infraProvided = capabilityList(device.infrastructure_provided);
  return (
    <ItemModal
      gameData={false}
      onClose={onClose}
      item={{
        name: device.name,
        type: 'parts',
        fields: [
          { label: 'Slot', value: device.slot },
          { label: 'Level', value: String(device.level) },
          ...(provides ? [{ label: 'Provides', value: provides }] : []),
          ...(requires ? [{ label: 'Requires', value: requires }] : []),
          ...(infraProvided ? [{ label: 'Infrastructure provided', value: infraProvided }] : []),
          ...(infraRequired ? [{ label: 'Infrastructure needed', value: infraRequired }] : []),
          ...(next ? [{ label: 'Next upgrade', value: next.name }] : []),
        ],
        text: device.description ? [device.description] : undefined,
      }}
    >
      <Section title="Build materials">
        <Materials list={device.build_materials} byId={byId} />
        <ValueNote list={device.build_materials} byId={byId} label="Total cost" />
      </Section>
    </ItemModal>
  );
}

function Objectives({ list, depth = 0 }: { list: QuestObjective[]; depth?: number }) {
  return (
    <ul className={depth ? 'ml-4 mt-1 list-disc space-y-0.5' : 'space-y-1.5'}>
      {list.map(objective => {
        const line = objectiveLine(objective);
        if (!line && !objective.sub_objectives?.length) return null;
        return (
          <li key={objective.id} className="text-xs leading-relaxed">
            {line}
            {objective.sub_objectives?.length ? <Objectives list={objective.sub_objectives} depth={depth + 1} /> : null}
          </li>
        );
      })}
    </ul>
  );
}

export function QuestModal({ quest, quests, byId, onClose }: { quest: HideoutQuest; quests: HideoutQuest[]; byId: ItemIndex; onClose: () => void }) {
  const requires = (quest.requires_quests ?? []).map(id => quests.find(entry => entry.id === id)?.name ?? id);
  const items = quest.rewards?.items ?? [];
  const recipes = quest.rewards?.recipes ?? [];
  const text = [quest.briefing, quest.debriefing].filter((value): value is string => Boolean(value));
  return (
    <ItemModal
      gameData={false}
      onClose={onClose}
      item={{
        name: quest.name,
        type: 'guide',
        fields: [
          ...(quest.vendor ? [{ label: 'Vendor', value: quest.vendor }] : []),
          ...(quest.required_vendor_level ? [{ label: 'Vendor level', value: String(quest.required_vendor_level) }] : []),
          ...(requires.length ? [{ label: 'Requires', value: requires.join(', ') }] : []),
        ],
        text,
      }}
    >
      {quest.objectives && quest.objectives.length > 0 && (
        <Section title="Objectives"><Objectives list={quest.objectives} /></Section>
      )}
      {(items.length > 0 || recipes.length > 0) && (
        <Section title="Rewards">
          <ul className="space-y-1">
            {items.map(entry => (
              <li key={entry.id} className="flex items-center gap-2 text-xs">
                <Thumb src={byId.get(entry.id)?.image} />
                <span className="min-w-0 flex-1 truncate">{entry.id === MONEY_ITEM_ID ? 'Cash' : entry.name}</span>
                <span className="font-mono">{entry.id === MONEY_ITEM_ID ? formatDollars(entry.count) : `×${entry.count}`}</span>
              </li>
            ))}
            {recipes.map(entry => <li key={entry.id} className="text-xs">Unlocks recipe: <span className="font-bold">{entry.name}</span></li>)}
          </ul>
        </Section>
      )}
    </ItemModal>
  );
}

