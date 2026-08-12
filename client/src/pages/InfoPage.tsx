// components
import { PageContainer } from "@/components";

/**
 * Full-page How To Play. Entered from the canvas Info asset (link `/info`).
 */
export const InfoPage = () => {
  return (
    <PageContainer isLoading={false} headerText="How to Play">
      <ol className="p2" style={{ paddingLeft: "1.25rem", listStyle: "decimal" }}>
        <li>Two players click the pink X or blue O sprite on the board to claim a symbol.</li>
        <li>Once both symbols are claimed, whoever is picked first moves first.</li>
        <li>Click cells on the board to place your mark. Get three in a row to win.</li>
        <li>Click the Reset asset when you want to start a new round.</li>
      </ol>
    </PageContainer>
  );
};

export default InfoPage;
