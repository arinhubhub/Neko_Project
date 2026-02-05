import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';

export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 24,
    },
    headerContainer: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 40,
    },
    logoimage: {
        width: 120,
        height: 120,
        marginBottom: 1,
        resizeMode: 'contain',
    },
    textimage: {
        width: 120,
        height: 12,
        marginTop: 1,
        marginBottom: 1,
        resizeMode: 'contain',
    },
    contentContainer: {},
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
        width: '80%',
        alignSelf: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 32,
        width: '80%',
        alignSelf: 'center',
    },
    inputGroup: {
        marginBottom: 20,
    },
    labelRow: {
        flexDirection: 'row',
        marginBottom: 8,
        width: '80%',
        alignSelf: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
      
        
    },
     labelprofile: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginLeft: '10%',
        margin : 10,
        
    },
    required: {
        color: '#ff0000',
        fontSize: 14,
    },
    input: {
        width: '80%',
        height: 50,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#F9F9F9',
        color: '#333',
        alignSelf: 'center',

    },

    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        width: '80%',
        alignSelf: 'center',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderRadius: 4,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },

    checkboxChecked: {
        borderColor: '#2D9CDB',
        backgroundColor: '#2D9CDB',
    },
    checkboxInner: {
        width: 10,
        height: 10,
        backgroundColor: '#fff',
    },
    checkboxLabel: {
        fontSize: 14,
        color: '#555',
    },

    linkText: {
        color: '#16A085',
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    button: {
        backgroundColor: '#1E1E1E',
        height: 56,
        borderRadius: 160,
        alignItems: 'center',
        width: 300,
        justifyContent: 'center',
        marginBottom: 24,
        alignSelf: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#555',
    },
    // Proflie specific styles
    profileHeader: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 20,
    },
    profileImageContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#95C1BB', // Green circle color from image
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 5,
        borderColor: '#7DAFA8', 
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 5,
    },
    caregiverBadge: {
        backgroundColor: '#D6E4E2',
        paddingVertical: 5,
        paddingHorizontal: 15,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    caregiverText: {
        color: '#5B8C85',
        fontWeight: 'bold',
        marginLeft: 5,
        fontSize: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2F6A62', // Darker green for title
        marginBottom: 10,
        marginLeft: '10%',
        alignSelf: 'flex-start',
        textTransform: 'uppercase',
    },
    // Cat Profile Specific Styles
    rowContainer: {
        flexDirection: 'row',
        width: '80%',
        alignSelf: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#D8E8E6',
        borderRadius: 12,
        padding: 4,
        width: '48%',
        height: 50,
        alignItems: 'center',
    },
    toggleButton: {
        flex: 1,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
    },
    toggleButtonActive: {
        backgroundColor: '#1C5D55', // Dark green active
    },
    toggleText: {
        color: '#5B8C85',
        fontSize: 14,
    },
    toggleTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    weightContainer: {
        width: '48%',
    },
    weightInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1C5D55',
        borderRadius: 12,
        backgroundColor: '#D8E8E6',
        height: 50,
        paddingHorizontal: 10,
    },
    weightInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    unitText: {
        fontSize: 14,
        color: '#1C5D55',
        fontWeight: '500',
    },
    activityContainer: {
        flexDirection: 'row',
        width: '85%',
        alignSelf: 'center',
        justifyContent: 'space-between',
        marginBottom: 30,
        backgroundColor: '#D8E8E6',
        borderRadius: 16,
        padding: 5,
        height: 80,
    },
     activityButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        marginHorizontal: 2,
    },
    activityButtonActive: {
         backgroundColor: '#95C1BB',
         borderWidth: 1,
         borderColor: '#1C5D55'
    },
    activityText: {
        marginTop: 4,
        fontSize: 12,
        color: '#2F6A62',
        fontWeight: '500',
    },
    iconPlaceholder: {
        fontSize: 18,
        color: '#2F6A62',
    }

});
