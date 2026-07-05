type DashboardProps = {
  totalAnimals: number;
};

export default function Dashboard({ totalAnimals }: DashboardProps) {
  return (
    <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

      <div className="bg-white rounded-[28px] p-6 shadow-lg border border-[#f1eadf]">
        <div className="flex items-center gap-4">

          <div className="w-16 h-16 rounded-full bg-[#dff5ee] flex items-center justify-center text-3xl">
            🐾
          </div>

          <div>
            <p className="text-gray-500 font-semibold">
              Animaux disponibles
            </p>

            <h2 className="text-5xl font-black text-[#064b42]">
              {totalAnimals}
            </h2>
          </div>

        </div>
      </div>

      <div className="bg-white rounded-[28px] p-6 shadow-lg border border-[#f1eadf]">
        <div className="flex items-center gap-4">

          <div className="w-16 h-16 rounded-full bg-[#ffe7e7] flex items-center justify-center text-3xl">
            ❤️
          </div>

          <div>
            <h2 className="text-2xl font-black text-[#064b42]">
              Chaque swipe peut changer une vie
            </h2>

            <p className="text-gray-500 font-medium mt-1">
              Trouvez le compagnon qui vous correspond.
            </p>
          </div>

        </div>
      </div>

    </section>
  );
}