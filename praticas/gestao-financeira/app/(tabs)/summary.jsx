import { useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MoneyContext } from "../../contexts/GlobalState";
import SummaryItem from "../../components/SummaryItem";
import { globalStyles } from "../../styles/globalStyles";
import { colors } from "../../constants/colors";
import { PieChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

/**
 * Tela "Resumo".
 *
 * Itera sobre as categorias vindas do servidor (não há mais lista hardcoded)
 * e calcula:
 *  - totais por categoria (somatório dos `value` das transações da categoria);
 *  - saldo final = soma das transações de categorias `isIncome` menos as demais.
 *
 * @returns {JSX.Element}
 */
export default function Summary() {
  const { transactions, categories, loading } = useContext(MoneyContext);

  const hoje = new Date();

  const [mesSelecionado, setMesSelecionado] = useState(
    hoje.getMonth() + 1
  );

  const [anoSelecionado, setAnoSelecionado] = useState(
    hoje.getFullYear()
  );

  const meses = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const data = new Date(transaction.date);

      return (
        data.getMonth() + 1 === mesSelecionado &&
        data.getFullYear() === anoSelecionado
      );
    });
  }, [transactions, mesSelecionado, anoSelecionado]);

  const { totalsById, balance } = useMemo(() => {
    const acc = {};
    let saldo = 0;

    for (const c of categories) acc[c.id] = 0;

    for (const t of filteredTransactions) {
      const numericValue = Number(t.value);
      if (acc[t.categoryId] !== undefined) {
        acc[t.categoryId] += numericValue;
      }
      const cat = t.category ?? categories.find((c) => c.id === t.categoryId);
      if (cat?.isIncome) {
        saldo += numericValue;
      } else {
        saldo -= numericValue;
      }
    }
    return { totalsById: acc, balance: saldo };
  }, [filteredTransactions, categories]);

  if (loading && categories.length === 0) {
    return (
      <View style={[globalStyles.screenContainer, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const balanceStyle =
    balance >= 0 ? globalStyles.positiveText : globalStyles.negativeText;

  const screenWidth = Dimensions.get("window").width;

  const pieData = categories
    .filter((category) => (totalsById[category.id] ?? 0) > 0)
    .map((category) => ({
      name: category.displayName,
      value: totalsById[category.id],
      color: category.background,
      legendFontColor: "#333",
      legendFontSize: 12,
    }));

  return (
    <View style={globalStyles.screenContainer}>
      <ScrollView style={globalStyles.content}>
        <View style={styles.filters}>
          <TouchableOpacity
            onPress={() => {
              if (mesSelecionado === 1) {
                setMesSelecionado(12);
                setAnoSelecionado((prev) => prev - 1);
              } else {
                setMesSelecionado((prev) => prev - 1);
              }
            }}
          >
            <Text style={styles.filterButton}>◀</Text>
          </TouchableOpacity>

          <Text style={styles.filterText}>
            {meses[mesSelecionado - 1]} / {anoSelecionado}
          </Text>

          <TouchableOpacity
            onPress={() => {
              if (mesSelecionado === 12) {
                setMesSelecionado(1);
                setAnoSelecionado((prev) => prev + 1);
              } else {
                setMesSelecionado((prev) => prev + 1);
              }
            }}
          >
            <Text style={styles.filterButton}>▶</Text>
          </TouchableOpacity>
        </View>

        {pieData.length > 0 && (
          <>
            <Text style={styles.chartTitle}>
              Distribuição das Transações
            </Text>

            <PieChart
              data={pieData}
              width={screenWidth - 20}
              height={220}
              chartConfig={{
                color: () => "#000",
              }}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </>
        )}

        {categories.map((category) => (
          <SummaryItem
            key={category.id}
            category={category}
            value={totalsById[category.id] ?? 0}
          />
        ))}
        <View style={globalStyles.line} />
        <View style={styles.balance}>
          <Text style={styles.balanceText}>Saldo</Text>
          <Text style={balanceStyle}>
            {balance.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  balance: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  balanceText: {
    fontSize: 18,
    color: colors.primaryText,
    fontWeight: "800",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    marginTop: 10,
    color: colors.primaryText,
  },
  filters: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    paddingVertical: 12,
  },

  filterButton: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.primary,
  },

  filterText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primaryText,
  },
});
