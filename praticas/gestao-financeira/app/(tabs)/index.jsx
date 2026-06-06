import { useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MoneyContext } from "../../contexts/GlobalState";
import TransactionItem from "../../components/TransactionItem";
import { globalStyles } from "../../styles/globalStyles";
import { colors } from "../../constants/colors";
import { router } from "expo-router";

/**
 * Tela "Transações".
 *
 * Lista as transações vindas do servidor, com:
 *  - estado de carregamento inicial,
 *  - mensagem de erro com botão de "Tentar novamente",
 *  - pull-to-refresh,
 *  - long-press para excluir.
 *
 * @returns {JSX.Element}
 */
export default function Transactions() {
  const {
    transactions,
    loading,
    error,
    refresh,
    removeTransaction,
    editTransaction,
    user,
    setUser,
  } = useContext(MoneyContext);

  const handleLogout = () => {
    Alert.alert(
      "Sair",
      "Deseja encerrar a sessão?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: () => {
            setUser(null);
            router.replace("/login");
          },
        },
      ]
    );
  };

  const hoje = new Date();

  const [mesSelecionado, setMesSelecionado] = useState(
    hoje.getMonth() + 1
  );

  const [anoSelecionado, setAnoSelecionado] = useState(
    hoje.getFullYear()
  );

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editDescription, setEditDescription] = useState("");
  const [editValue, setEditValue] = useState("");

  const openEditModal = (item) => {
    setSelectedTransaction(item);
    setEditDescription(item.description);
    setEditValue(String(item.value));
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editDescription.trim()) {
      Alert.alert("Informe a descrição.");
      return;
    }

    const numericValue = Number(
      editValue.replace(",", ".")
    );

    if (!numericValue || numericValue <= 0) {
      Alert.alert("Informe um valor maior que zero.");
      return;
    }

    try {
      await editTransaction(selectedTransaction.id, {
        description: editDescription.trim(),
        value: numericValue,
      });

      setEditModalVisible(false);
      setSelectedTransaction(null);
      Alert.alert("Transação editada com sucesso!");
    } catch (e) {
      Alert.alert("Erro ao editar", e.message ?? "Tente novamente.");
    }
  };

  const handleLongPress = (item) => {
    Alert.alert(
      "Transação",
      `O que deseja fazer com "${item.description}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Editar",
          onPress: () => openEditModal(item),
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await removeTransaction(item.id);
            } catch (e) {
              Alert.alert("Erro ao excluir", e.message ?? "Tente novamente.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const data = new Date(transaction.date);

      return (
        data.getMonth() + 1 === mesSelecionado &&
        data.getFullYear() === anoSelecionado
      );
    });
  }, [transactions, mesSelecionado, anoSelecionado]);

  if (loading && transactions.length === 0) {
    return (
      <View style={[globalStyles.screenContainer, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={globalStyles.secondaryText}>Carregando transações...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[globalStyles.screenContainer, styles.center]}>
        <Text style={globalStyles.primaryText}>
          Não foi possível carregar.
        </Text>
        <Text style={globalStyles.secondaryText}>{error}</Text>
        <TouchableOpacity onPress={refresh} style={styles.retry}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

  return (
    <View style={globalStyles.screenContainer}>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>

      <Text style={styles.welcomeText}>
        Bem-vindo, {user?.name ?? "Usuário"}!
      </Text>

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

      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Editar transação</Text>

            <Text style={globalStyles.inputLabel}>Descrição</Text>
            <TextInput
              value={editDescription}
              onChangeText={setEditDescription}
              style={globalStyles.input}
              placeholder="Descrição"
            />

            <Text style={globalStyles.inputLabel}>Valor</Text>
            <TextInput
              value={editValue}
              onChangeText={setEditValue}
              style={globalStyles.input}
              placeholder="Valor"
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveEdit}
                style={[styles.modalButton, styles.saveButton]}
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onLongPress={() => handleLongPress(item)}
            activeOpacity={0.7}
          >
            <TransactionItem {...item} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={globalStyles.secondaryText}>
            Nenhuma transação encontrada neste mês.
          </Text>
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
  },
  retry: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: colors.primaryContrast,
    fontWeight: "600",
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
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },

  modalContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primaryText,
    marginBottom: 8,
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 12,
  },

  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.secondaryText,
  },

  saveButton: {
    backgroundColor: colors.primary,
  },

  cancelButtonText: {
    color: colors.primaryText,
    fontWeight: "bold",
  },

  saveButtonText: {
    color: colors.primaryContrast,
    fontWeight: "bold",
  },

  logoutButton: {
    alignSelf: "flex-end",
    marginRight: 20,
    marginTop: 10,
  },

  logoutText: {
    color: colors.primary,
    fontWeight: "bold",
    fontSize: 16,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primaryText,
    textAlign: "center",
    marginBottom: 10,
  },
});
