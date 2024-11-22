function PackedBubbleChart({ data }) {
  // TODO: Prototype packed bubble chart.
  //       See https://observablehq.com/@d3/pack/2 and d3.pack(), d3.hierarchy().
  return (
    <>
      <h2>
        Loaded {data?.allEmissions?.length || 0} allEmissions rows and
        {data?.equivEmissions?.length || 0} equivEmissions rows.
      </h2>
    </>
  );
}

export default PackedBubbleChart;
