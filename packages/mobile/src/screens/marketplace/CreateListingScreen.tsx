import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Chip } from "@components/ui/Chip";
import { useMarketplace } from "@hooks/useMarketplace";
import { validatePrice } from "@utils/validation";

const CATEGORIES = ["seeds", "fertilizers", "tools", "services", "harvest"];

const CURRENCIES = ["GREEN_CREDITS", "USD", "EUR"];

export function CreateListingScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("GVC");
  const [quantity, setQuantity] = useState("1");
  const [isLocal, setIsLocal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!category) newErrors.category = "Category is required";
    const priceError = validatePrice(price);
    if (priceError) newErrors.price = priceError;
    if (!quantity || parseInt(quantity) < 1)
      newErrors.quantity = "Quantity must be at least 1";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { createListing } = useMarketplace();

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await createListing({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        price: parseFloat(price),
        currency,
        quantity: parseInt(quantity),
      });
      Alert.alert("Success", "Your listing has been created.");
      router.back();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to create listing";
      Alert.alert("Error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-50"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Images Upload */}
        <TouchableOpacity className="bg-white border-2 border-dashed border-gray-300 rounded-2xl h-32 items-center justify-center mb-4">
          <Text className="text-3xl mb-2">📷</Text>
          <Text className="text-sm text-gray-500">Add Photos</Text>
        </TouchableOpacity>

        <Input
          label="Title"
          placeholder="What are you selling?"
          value={title}
          onChangeText={(t) => {
            setTitle(t);
            setErrors((p) => ({ ...p, title: "" }));
          }}
          error={errors.title}
        />

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Description
          </Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 min-h-[100px]"
            placeholder="Describe your item..."
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Category */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Category
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                selected={category === cat}
                onPress={() => {
                  setCategory(cat);
                  setErrors((p) => ({ ...p, category: "" }));
                }}
              />
            ))}
          </View>
          {errors.category && (
            <Text className="text-red-500 text-xs mt-1">{errors.category}</Text>
          )}
        </View>

        {/* Price and Currency */}
        <View className="flex-row gap-3">
          <View className="flex-[2]">
            <Input
              label="Price"
              placeholder="0.00"
              value={price}
              onChangeText={setPrice}
              error={errors.price}
              keyboardType="decimal-pad"
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">
              Currency
            </Text>
            <View className="flex-row gap-1">
              {CURRENCIES.map((cur) => (
                <Chip
                  key={cur}
                  label={cur}
                  selected={currency === cur}
                  onPress={() => setCurrency(cur)}
                  size="sm"
                />
              ))}
            </View>
          </View>
        </View>

        <Input
          label="Quantity"
          placeholder="1"
          value={quantity}
          onChangeText={setQuantity}
          error={errors.quantity}
          keyboardType="number-pad"
        />

        {/* Local Toggle */}
        <TouchableOpacity
          onPress={() => setIsLocal(!isLocal)}
          className="flex-row items-center mb-6"
        >
          <View
            className={`w-5 h-5 rounded border-2 items-center justify-center ${
              isLocal ? "bg-primary-600 border-primary-600" : "border-gray-300"
            }`}
          >
            {isLocal && <Text className="text-white text-xs">✓</Text>}
          </View>
          <Text className="text-sm text-gray-600 ml-2">
            Show only to nearby gardeners
          </Text>
        </TouchableOpacity>

        <Button
          title="Create Listing"
          onPress={handleSubmit}
          isLoading={isLoading}
          size="lg"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
