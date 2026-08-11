import { useContext } from "react";
import { GlobalStateContext } from "@/context/GlobalContext";

export const BadgesTab = () => {
  const { badges, visitorInventory } = useContext(GlobalStateContext);
  const badgeList = Object.values(badges || {});

  if (badgeList.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="p2">No ecosystem badges configured yet.</p>
      </div>
    );
  }

  return (
    <div className="badge-grid">
      {badgeList.map((badge) => {
        const owned = visitorInventory && badge.name in visitorInventory;
        return (
          <div className="tooltip" key={badge.name}>
            <span className="tooltip-content" style={{ width: "115px" }}>
              {badge.description || badge.name}
            </span>
            <img
              src={badge.icon}
              alt={badge.name}
              className={owned ? "" : "badge-img-grayscale"}
              style={{ maxWidth: "100%" }}
            />
            <p className="p3 pb-2">{badge.name}</p>
          </div>
        );
      })}
    </div>
  );
};

export default BadgesTab;
