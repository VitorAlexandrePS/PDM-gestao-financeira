import { useContext, useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { router } from "expo-router";
import Button from "../components/Button";
import { MoneyContext } from "../contexts/GlobalState";
import { globalStyles } from "../styles/globalStyles";
import { colors } from "../constants/colors";

export default function Login() {
    const { login } = useContext(MoneyContext);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert("Preencha usuário e senha.");
            return;
        }

        setSubmitting(true);

        try {
            await login(username.trim(), password.trim());
            router.replace("/(tabs)");
        } catch (e) {
            Alert.alert("Erro no login", "Usuário ou senha inválidos.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={[globalStyles.screenContainer, styles.container]}>
            <Text style={styles.title}>Gestão Financeira</Text>

            <Text style={globalStyles.inputLabel}>Usuário</Text>
            <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Digite seu Usuário"
                autoCapitalize="none"
                style={styles.input}
            />

            <Text style={globalStyles.inputLabel}>Senha</Text>
            <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Digite sua senha"
                secureTextEntry
                style={styles.input}
            />

            <Button onPress={handleLogin} disabled={submitting}>
                {submitting ? "Entrando..." : "Entrar"}
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        padding: 24,
        gap: 12,
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        color: colors.primary,
        textAlign: "center",
        marginBottom: 24,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: colors.secondaryText,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        backgroundColor: colors.background,
    },
});